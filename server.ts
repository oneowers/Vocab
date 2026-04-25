import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { prisma } from './src/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side Supabase client with Service Role Key for admin actions
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Rate limiter for translation
  const translationLimiter = rateLimit({
    windowMs: 1000,
    max: 1,
    message: { error: 'Too many translation requests' },
  });

  // Auth Middleware
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // Sync user with Prisma
    let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) {
      // First user is ADMIN
      const userCount = await prisma.user.count();
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata.full_name,
          avatarUrl: user.user_metadata.avatar_url,
          role: userCount === 0 ? 'ADMIN' : 'USER',
        },
      });
    }

    req.user = dbUser;
    next();
  };

  const adminOnly = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    next();
  };

  // API Routes
  app.get('/api/me', authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // Cards
  app.get('/api/cards', authenticate, async (req: any, res) => {
    const { tag, search } = req.query;
    const cards = await prisma.card.findMany({
      where: {
        userId: req.user.id,
        tags: tag ? { has: tag as string } : undefined,
        OR: search ? [
          { original: { contains: search as string, mode: 'insensitive' } },
          { translation: { contains: search as string, mode: 'insensitive' } },
        ] : undefined,
      },
      orderBy: { dateAdded: 'desc' },
    });
    res.json(cards);
  });

  app.post('/api/cards', authenticate, async (req: any, res) => {
    const { original, translation, direction, example, phonetic, tags } = req.body;
    
    // Check for duplicates
    const exist = await prisma.card.findFirst({
      where: { userId: req.user.id, original, translation }
    });
    if (exist) return res.status(400).json({ error: 'Card already exists' });

    const card = await prisma.card.create({
      data: {
        userId: req.user.id,
        original,
        translation,
        direction,
        example,
        phonetic,
        tags: tags || [],
        nextReviewDate: new Date().toISOString().split('T')[0],
      },
    });

    // Analytics
    const todayStr = new Date().toISOString().split('T')[0];
    await prisma.appAnalytics.upsert({
      where: { date: todayStr },
      create: { date: todayStr, newCards: 1 },
      update: { newCards: { increment: 1 } },
    });

    res.json(card);
  });

  app.patch('/api/cards/:id', authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { nextReviewDate, reviewCount, correctCount, wrongCount } = req.body;
    
    const card = await prisma.card.update({
      where: { id, userId: req.user.id },
      data: { nextReviewDate, reviewCount, correctCount, wrongCount },
    });
    res.json(card);
  });

  app.delete('/api/cards/:id', authenticate, async (req: any, res) => {
    const { id } = req.params;
    await prisma.card.delete({
      where: { id, userId: req.user.id },
    });
    res.json({ success: true });
  });

  // Review
  app.post('/api/review', authenticate, async (req: any, res) => {
    const { cardId, result } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    // Log review
    await prisma.reviewLog.create({
      data: {
        userId: req.user.id,
        cardId,
        result,
      }
    });

    // Update Analytics
    await prisma.appAnalytics.upsert({
      where: { date: todayStr },
      create: { date: todayStr, totalReviews: 1 },
      update: { totalReviews: { increment: 1 } },
    });

    // Update User Streak
    let newStreak = req.user.streak;
    const lastDate = req.user.lastReviewDate;
    
    if (lastDate === todayStr) {
      // Already reviewed today, keep streak
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        streak: newStreak,
        lastReviewDate: todayStr,
        lastActiveAt: new Date(),
      }
    });

    res.json({ streak: updatedUser.streak });
  });

  app.get('/api/review/logs', authenticate, async (req: any, res) => {
    const logs = await prisma.reviewLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  });

  // Admin
  app.get('/api/admin/users', authenticate, adminOnly, async (req: any, res) => {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { cards: true, reviewLogs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  });

  app.patch('/api/admin/users/:id', authenticate, adminOnly, async (req: any, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.json(user);
  });

  app.delete('/api/admin/users/:id', authenticate, adminOnly, async (req: any, res) => {
    const { id } = req.params;
    await prisma.$transaction([
      prisma.reviewLog.deleteMany({ where: { userId: id } }),
      prisma.card.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    res.json({ success: true });
  });

  app.get('/api/admin/analytics', authenticate, adminOnly, async (req, res) => {
    const analytics = await prisma.appAnalytics.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    });
    const totals = {
      users: await prisma.user.count(),
      cards: await prisma.card.count(),
      reviews: await prisma.reviewLog.count(),
      sessions: (await prisma.appAnalytics.aggregate({ _sum: { totalSessions: true } }))._sum.totalSessions || 0,
    };
    res.json({ dayStats: analytics, totals });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
