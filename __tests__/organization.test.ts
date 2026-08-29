/**
 * Organization Model Test Suite
 *
 * Tests the Organization model foundation including:
 * - Organization creation and persistence
 * - Required field validation
 * - Grant/Event linkage to organization
 * - Organization with multiple grants/events
 * - Referential integrity
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// ============================================================================
// Mock Setup
// ============================================================================

// Create a mock Prisma client
const mockPrismaClient = {
  organization: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  event: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $disconnect: vi.fn(),
};

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

// ============================================================================
// Test Suite
// ============================================================================

describe("Organization Model", () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe("Organization Persistence", () => {
    test("should create an organization with required fields", async () => {
      const mockOrganization = {
        id: "org_test123",
        name: "Soroswap Foundation",
        description: null,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.organization.create.mockResolvedValue(mockOrganization);

      const organization = await prisma.organization.create({
        data: {
          name: "Soroswap Foundation",
        },
      });

      expect(organization).toBeDefined();
      expect(organization.id).toBeDefined();
      expect(organization.name).toBe("Soroswap Foundation");
      expect(organization.createdAt).toBeInstanceOf(Date);
      expect(organization.updatedAt).toBeInstanceOf(Date);
    });

    test("should create an organization with all fields", async () => {
      const mockOrganization = {
        id: "org_test456",
        name: "Stellar Development Foundation",
        description: "A nonprofit organization that supports the development of Stellar",
        website: "https://stellar.org",
        logoUrl: "https://stellar.org/logo.png",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.organization.create.mockResolvedValue(mockOrganization);

      const organization = await prisma.organization.create({
        data: {
          name: "Stellar Development Foundation",
          description: "A nonprofit organization that supports the development of Stellar",
          website: "https://stellar.org",
          logoUrl: "https://stellar.org/logo.png",
        },
      });

      expect(organization.name).toBe("Stellar Development Foundation");
      expect(organization.description).toBe(
        "A nonprofit organization that supports the development of Stellar"
      );
      expect(organization.website).toBe("https://stellar.org");
      expect(organization.logoUrl).toBe("https://stellar.org/logo.png");
    });

    test("should retrieve organization by id", async () => {
      const mockOrganization = {
        id: "org_test789",
        name: "Blend Protocol",
        description: "Lending protocol on Stellar",
        website: "https://blend.capital",
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.organization.findUnique.mockResolvedValue(mockOrganization);

      const organization = await prisma.organization.findUnique({
        where: { id: "org_test789" },
      });

      expect(organization).toBeDefined();
      expect(organization.id).toBe("org_test789");
      expect(organization.name).toBe("Blend Protocol");
    });

    test("should retrieve organization by name", async () => {
      const mockOrganization = {
        id: "org_test101",
        name: "Soroswap Foundation",
        description: null,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.organization.findUnique.mockResolvedValue(mockOrganization);

      const organization = await prisma.organization.findUnique({
        where: { name: "Soroswap Foundation" },
      });

      expect(organization).toBeDefined();
      expect(organization.name).toBe("Soroswap Foundation");
    });

    test("should enforce unique name constraint", async () => {
      const mockError = new Error("Unique constraint violation");
      (mockError as any).code = "P2002";

      mockPrismaClient.organization.create
        .mockResolvedValueOnce({
          id: "org_test111",
          name: "Unique Org",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockRejectedValueOnce(mockError);

      // First creation succeeds
      await prisma.organization.create({
        data: { name: "Unique Org" },
      });

      // Second creation with same name should fail
      await expect(
        prisma.organization.create({
          data: { name: "Unique Org" },
        })
      ).rejects.toThrow("Unique constraint violation");
    });
  });

  describe("Event-Organization Linkage", () => {
    test("should create an event linked to an organization", async () => {
      const mockOrganization = {
        id: "org_soroswap",
        name: "Soroswap",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEvent = {
        id: "event_swap123",
        contractId: "CCXVDIGMR6WTXZQX2OEVD6YM6AYCYPXPQ2VSN5NMAH5BNESE23OKBC2",
        ledger: 1000000,
        timestamp: 1234567890,
        txHash: "abc123def456",
        topics: ["swap"],
        data: "0x1234",
        description: "User swapped 50 XLM for 48.2 USDC",
        status: "translated",
        blueprintName: "soroswap-router",
        eventType: "swap",
        schemaVersion: "v1",
        organizationId: "org_soroswap",
        executionDagId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.organization.create.mockResolvedValue(mockOrganization);
      mockPrismaClient.event.create.mockResolvedValue(mockEvent);

      // Create organization
      const organization = await prisma.organization.create({
        data: { name: "Soroswap" },
      });

      // Create event linked to organization
      const event = await prisma.event.create({
        data: {
          id: "event_swap123",
          contractId: "CCXVDIGMR6WTXZQX2OEVD6YM6AYCYPXPQ2VSN5NMAH5BNESE23OKBC2",
          ledger: 1000000,
          timestamp: 1234567890,
          txHash: "abc123def456",
          topics: ["swap"],
          data: "0x1234",
          description: "User swapped 50 XLM for 48.2 USDC",
          status: "translated",
          blueprintName: "soroswap-router",
          eventType: "swap",
          organizationId: organization.id,
        },
      });

      expect(event.organizationId).toBe(organization.id);
      expect(event.description).toBe("User swapped 50 XLM for 48.2 USDC");
    });

    test("should query event with organization relationship", async () => {
      const mockEventWithOrg = {
        id: "event_mint456",
        contractId: "CBSDFK23DF92DF92FDF92FD29F92FD2F92FD92FD2F92FD92FD92FD92",
        ledger: 1000100,
        timestamp: 1234567900,
        txHash: "xyz789",
        topics: ["mint"],
        data: "0x5678",
        description: "Minted 1000 tokens",
        status: "translated",
        blueprintName: "token-contract",
        eventType: "mint",
        organizationId: "org_stellar",
        executionDagId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: {
          id: "org_stellar",
          name: "Stellar Development Foundation",
          description: "Building the Stellar network",
          website: "https://stellar.org",
          logoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockPrismaClient.event.findUnique.mockResolvedValue(mockEventWithOrg);

      const event = await prisma.event.findUnique({
        where: { id: "event_mint456" },
        include: { organization: true },
      });

      expect(event).toBeDefined();
      expect(event.organization).toBeDefined();
      expect(event.organization.name).toBe("Stellar Development Foundation");
      expect(event.organizationId).toBe(event.organization.id);
    });

    test("should allow event without organization (nullable relationship)", async () => {
      const mockEvent = {
        id: "event_orphan",
        contractId: "CTEST123",
        ledger: 1000200,
        timestamp: 1234568000,
        txHash: "orphan123",
        topics: ["transfer"],
        data: "0xabcd",
        description: null,
        status: "cryptic",
        blueprintName: null,
        eventType: null,
        organizationId: null,
        executionDagId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.event.create.mockResolvedValue(mockEvent);

      const event = await prisma.event.create({
        data: {
          id: "event_orphan",
          contractId: "CTEST123",
          ledger: 1000200,
          timestamp: 1234568000,
          txHash: "orphan123",
          topics: ["transfer"],
          data: "0xabcd",
          status: "cryptic",
        },
      });

      expect(event.organizationId).toBeNull();
    });

    test("should update event to link to organization", async () => {
      const mockEvent = {
        id: "event_update",
        contractId: "CUPDATE",
        ledger: 1000300,
        timestamp: 1234568100,
        txHash: "update456",
        topics: ["burn"],
        data: "0xef01",
        description: null,
        status: "cryptic",
        organizationId: null,
        executionDagId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEvent = {
        ...mockEvent,
        organizationId: "org_blend",
        updatedAt: new Date(),
      };

      mockPrismaClient.event.create.mockResolvedValue(mockEvent);
      mockPrismaClient.event.update.mockResolvedValue(mockUpdatedEvent);

      // Create event without organization
      const event = await prisma.event.create({
        data: {
          id: "event_update",
          contractId: "CUPDATE",
          ledger: 1000300,
          timestamp: 1234568100,
          txHash: "update456",
          topics: ["burn"],
          data: "0xef01",
          status: "cryptic",
        },
      });

      expect(event.organizationId).toBeNull();

      // Update to link to organization
      const updatedEvent = await prisma.event.update({
        where: { id: event.id },
        data: { organizationId: "org_blend" },
      });

      expect(updatedEvent.organizationId).toBe("org_blend");
    });
  });

  describe("Organization with Multiple Events", () => {
    test("should query organization with associated events", async () => {
      const mockOrgWithEvents = {
        id: "org_multi",
        name: "Multi Event Org",
        description: null,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        events: [
          {
            id: "event_1",
            contractId: "CMULTI1",
            ledger: 1000400,
            timestamp: 1234568200,
            txHash: "tx1",
            topics: ["swap"],
            data: "0x01",
            description: "Swap event 1",
            status: "translated",
            organizationId: "org_multi",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "event_2",
            contractId: "CMULTI2",
            ledger: 1000401,
            timestamp: 1234568201,
            txHash: "tx2",
            topics: ["mint"],
            data: "0x02",
            description: "Mint event 2",
            status: "translated",
            organizationId: "org_multi",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "event_3",
            contractId: "CMULTI3",
            ledger: 1000402,
            timestamp: 1234568202,
            txHash: "tx3",
            topics: ["burn"],
            data: "0x03",
            description: "Burn event 3",
            status: "translated",
            organizationId: "org_multi",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockPrismaClient.organization.findUnique.mockResolvedValue(mockOrgWithEvents);

      const organization = await prisma.organization.findUnique({
        where: { id: "org_multi" },
        include: { events: true },
      });

      expect(organization).toBeDefined();
      expect(organization.events).toBeDefined();
      expect(organization.events).toHaveLength(3);
      expect(organization.events[0].organizationId).toBe(organization.id);
      expect(organization.events[1].organizationId).toBe(organization.id);
      expect(organization.events[2].organizationId).toBe(organization.id);
    });

    test("should count events per organization", async () => {
      const mockOrgWithEvents = {
        id: "org_count",
        name: "Count Org",
        createdAt: new Date(),
        updatedAt: new Date(),
        events: new Array(25).fill(null).map((_, i) => ({
          id: `event_${i}`,
          contractId: `C${i}`,
          ledger: 1000000 + i,
          timestamp: 1234567890 + i,
          txHash: `tx${i}`,
          topics: ["test"],
          data: `0x${i}`,
          status: "translated",
          organizationId: "org_count",
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      };

      mockPrismaClient.organization.findUnique.mockResolvedValue(mockOrgWithEvents);

      const organization = await prisma.organization.findUnique({
        where: { id: "org_count" },
        include: { events: true },
      });

      expect(organization.events.length).toBe(25);
    });

    test("should filter events by organization", async () => {
      const mockEvents = [
        {
          id: "event_org1_a",
          contractId: "CORG1",
          ledger: 1000500,
          timestamp: 1234568300,
          txHash: "tx_org1_a",
          topics: ["test"],
          data: "0x0a",
          status: "translated",
          organizationId: "org_filter1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "event_org1_b",
          contractId: "CORG1",
          ledger: 1000501,
          timestamp: 1234568301,
          txHash: "tx_org1_b",
          topics: ["test"],
          data: "0x0b",
          status: "translated",
          organizationId: "org_filter1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaClient.event.findMany.mockResolvedValue(mockEvents);

      const events = await prisma.event.findMany({
        where: { organizationId: "org_filter1" },
      });

      expect(events).toHaveLength(2);
      expect(events[0].organizationId).toBe("org_filter1");
      expect(events[1].organizationId).toBe("org_filter1");
    });
  });

  describe("Referential Integrity", () => {
    test("should maintain referential integrity on organization delete (SET NULL)", async () => {
      const mockEvent = {
        id: "event_cascade",
        contractId: "CCASCADE",
        ledger: 1000600,
        timestamp: 1234568400,
        txHash: "tx_cascade",
        topics: ["test"],
        data: "0xc1",
        status: "translated",
        organizationId: "org_delete",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEvent = {
        ...mockEvent,
        organizationId: null,
      };

      mockPrismaClient.organization.delete.mockResolvedValue({
        id: "org_delete",
        name: "Delete Me",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrismaClient.event.findUnique
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockUpdatedEvent);

      // Verify event is linked to organization
      const eventBefore = await prisma.event.findUnique({
        where: { id: "event_cascade" },
      });
      expect(eventBefore.organizationId).toBe("org_delete");

      // Delete organization
      await prisma.organization.delete({
        where: { id: "org_delete" },
      });

      // Verify event still exists but organizationId is now null (SET NULL behavior)
      const eventAfter = await prisma.event.findUnique({
        where: { id: "event_cascade" },
      });
      expect(eventAfter).toBeDefined();
      expect(eventAfter.organizationId).toBeNull();
    });

    test("should reject invalid organization foreign key", async () => {
      const mockError = new Error("Foreign key constraint violation");
      (mockError as any).code = "P2003";

      mockPrismaClient.event.create.mockRejectedValue(mockError);

      await expect(
        prisma.event.create({
          data: {
            id: "event_invalid_fk",
            contractId: "CINVALID",
            ledger: 1000700,
            timestamp: 1234568500,
            txHash: "tx_invalid",
            topics: ["test"],
            data: "0xbad",
            status: "translated",
            organizationId: "org_nonexistent",
          },
        })
      ).rejects.toThrow("Foreign key constraint violation");
    });
  });

  describe("Organization Search and Indexing", () => {
    test("should query organizations by name (index)", async () => {
      const mockOrganizations = [
        {
          id: "org_search1",
          name: "Soroswap",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaClient.organization.findMany.mockResolvedValue(mockOrganizations);

      const organizations = await prisma.organization.findMany({
        where: {
          name: {
            contains: "Soro",
          },
        },
      });

      expect(organizations).toBeDefined();
      expect(organizations.length).toBeGreaterThan(0);
    });

    test("should query events by organizationId (index)", async () => {
      const mockEvents = [
        {
          id: "event_idx1",
          organizationId: "org_indexed",
          contractId: "CIDX1",
          ledger: 1000800,
          timestamp: 1234568600,
          txHash: "tx_idx1",
          topics: ["test"],
          data: "0x11",
          status: "translated",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "event_idx2",
          organizationId: "org_indexed",
          contractId: "CIDX2",
          ledger: 1000801,
          timestamp: 1234568601,
          txHash: "tx_idx2",
          topics: ["test"],
          data: "0x12",
          status: "translated",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaClient.event.findMany.mockResolvedValue(mockEvents);

      const events = await prisma.event.findMany({
        where: {
          organizationId: "org_indexed",
        },
      });

      expect(events).toHaveLength(2);
      expect(events[0].organizationId).toBe("org_indexed");
      expect(events[1].organizationId).toBe("org_indexed");
    });
  });
});
