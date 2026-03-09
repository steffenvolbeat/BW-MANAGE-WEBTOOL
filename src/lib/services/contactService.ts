import { prisma } from "@/lib/database";
import { ContactType } from "@prisma/client";

// Contact service functions
export interface CreateContactData {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  department?: string;
  linkedinUrl?: string;
  xingUrl?: string;
  notes?: string;
  contactType?: ContactType;
}

export const ContactService = {
  // Get all contacts for a user
  async getByUserId(userId: string) {
    return prisma.contact.findMany({
      where: { userId },
      include: {
        activities: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            timestamp: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });
  },

  // Get single contact by ID
  async getById(id: string, userId: string) {
    return prisma.contact.findFirst({
      where: { id, userId },
      include: {
        activities: true,
      },
    });
  },

  // Create new contact
  async create(data: CreateContactData) {
    const { notes, ...rest } = data;
    return prisma.contact.create({
      data: { ...rest, notesText: notes } as any,
      include: {
        activities: true,
      },
    });
  },

  // Update contact
  async update(id: string, userId: string, data: Partial<CreateContactData>) {
    // Verify ownership
    const existing = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Contact not found or access denied");
    }

    const { notes, userId: _uid, ...updateRest } = data;
    return prisma.contact.update({
      where: { id },
      data: { ...updateRest, ...(notes !== undefined && { notesText: notes }) } as any,
      include: {
        activities: true,
      },
    });
  },

  // Delete contact
  async delete(id: string, userId: string) {
    // Verify ownership
    const existing = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Contact not found or access denied");
    }

    return prisma.contact.delete({
      where: { id },
    });
  },

  // Search contacts
  async search(userId: string, query: string) {
    return prisma.contact.findMany({
      where: {
        userId,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          { position: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        activities: true,
      },
      orderBy: { addedAt: "desc" },
    });
  },

  // Get contacts by company
  async getByCompany(userId: string, company: string) {
    return prisma.contact.findMany({
      where: {
        userId,
        company: { contains: company, mode: "insensitive" },
      },
      include: {
        activities: true,
      },
      orderBy: { addedAt: "desc" },
    });
  },
};
