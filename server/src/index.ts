import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createReportInputSchema,
  updateReportInputSchema,
  getReportsInputSchema,
  createFollowUpActionInputSchema,
  updateFollowUpActionInputSchema
} from './schema';

// Import handlers
import { createReport } from './handlers/create_report';
import { getReports } from './handlers/get_reports';
import { getReportById } from './handlers/get_report_by_id';
import { updateReport } from './handlers/update_report';
import { deleteReport } from './handlers/delete_report';
import { createFollowUpAction } from './handlers/create_follow_up_action';
import { updateFollowUpAction } from './handlers/update_follow_up_action';
import { getFollowUpActionsByReportId, getPendingFollowUpActions } from './handlers/get_follow_up_actions';
import { deleteFollowUpAction } from './handlers/delete_follow_up_action';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Report management routes
  createReport: publicProcedure
    .input(createReportInputSchema)
    .mutation(({ input }) => createReport(input)),

  getReports: publicProcedure
    .input(getReportsInputSchema.optional())
    .query(({ input }) => getReports(input)),

  getReportById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getReportById(input.id)),

  updateReport: publicProcedure
    .input(updateReportInputSchema)
    .mutation(({ input }) => updateReport(input)),

  deleteReport: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteReport(input.id)),

  // Follow-up action management routes
  createFollowUpAction: publicProcedure
    .input(createFollowUpActionInputSchema)
    .mutation(({ input }) => createFollowUpAction(input)),

  updateFollowUpAction: publicProcedure
    .input(updateFollowUpActionInputSchema)
    .mutation(({ input }) => updateFollowUpAction(input)),

  getFollowUpActionsByReportId: publicProcedure
    .input(z.object({ reportId: z.number() }))
    .query(({ input }) => getFollowUpActionsByReportId(input.reportId)),

  getPendingFollowUpActions: publicProcedure
    .query(() => getPendingFollowUpActions()),

  deleteFollowUpAction: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteFollowUpAction(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();