import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MockTicket, MockTicketStatus } from '../mock-data/types';
import { MOCK_TICKETS } from '../mock-data/tickets';
import { MOCK_USERS } from '../mock-data/tickets';
import { useMockData } from './useMockData';
import { executeTransition, getAvailableTransitions } from '../workflows/ticket';
import type { TicketCreateInput, TicketTransitionInput } from '../utils/validation';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TicketFilters {
  status?: MockTicketStatus;
  siteId?: string;
  severity?: string;
}

function filterTickets(tickets: MockTicket[], filters?: TicketFilters): MockTicket[] {
  if (!filters) return tickets;
  return tickets.filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.siteId && t.siteId !== filters.siteId) return false;
    if (filters.severity && t.severity !== filters.severity) return false;
    return true;
  });
}

export function useTicketList(filters?: TicketFilters) {
  const useMock = useMockData();

  return useQuery({
    queryKey: ['tickets', 'list', filters],
    queryFn: async (): Promise<MockTicket[]> => {
      if (!useMock) return [];
      await delay(300);
      return filterTickets(MOCK_TICKETS, filters);
    },
    staleTime: 30_000,
  });
}

export function useTicketDetail(id: string) {
  const useMock = useMockData();

  return useQuery({
    queryKey: ['tickets', 'detail', id],
    queryFn: async (): Promise<MockTicket | null> => {
      if (!useMock) return null;
      await delay(200);
      return MOCK_TICKETS.find(t => t.id === id) || null;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useTicketCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TicketCreateInput): Promise<MockTicket> => {
      await delay(500);
      const newTicket: MockTicket = {
        id: `ticket-mock-${Date.now()}`,
        displayId: `IR-2026-${String(MOCK_TICKETS.length + 1).padStart(4, '0')}`,
        title: input.title,
        description: input.description,
        type: input.type,
        severity: input.severity,
        status: 'open',
        siteId: input.siteId,
        assetId: input.assetId,
        raisedById: 'user-super',
        items: input.items ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
    },
  });
}

export function useTicketTransition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TicketTransitionInput) => {
      return executeTransition(input.ticketId, input.from as MockTicketStatus, input.to as MockTicketStatus, 'wli_gm', input.notes || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useTicketActions(status: MockTicketStatus, userRole: string) {
  return getAvailableTransitions(status, userRole);
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      await delay(100);
      return MOCK_USERS[0];
    },
    staleTime: Infinity,
  });
}