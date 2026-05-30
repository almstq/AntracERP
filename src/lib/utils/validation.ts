import { z } from 'zod';

export const ticketItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  type: z.enum(['part', 'labor', 'service']),
});

export const ticketCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  type: z.enum(['issue', 'service', 'maintenance']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  siteId: z.string().min(1, 'Site is required'),
  assetId: z.string().optional(),
  items: z.array(ticketItemSchema).optional().default([]),
});

export const ticketTransitionSchema = z.object({
  ticketId: z.string(),
  from: z.string(),
  to: z.string(),
  notes: z.string().optional().default(''),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketTransitionInput = z.infer<typeof ticketTransitionSchema>;