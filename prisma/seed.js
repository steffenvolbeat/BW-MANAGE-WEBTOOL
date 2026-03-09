const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    console.warn("No users found. Skipping seed (boards need an owner).");
    return;
  }

  const existing = await prisma.board.findFirst({ where: { name: "Demo Board" } });
  if (existing) {
    console.log("Demo board already exists. Skipping creation.");
    return;
  }

  const board = await prisma.board.create({
    data: {
      name: "Demo Board",
      ownerId: user.id,
    },
  });

  const todo = await prisma.boardColumn.create({
    data: { boardId: board.id, title: "To Do", position: 0 },
  });
  const doing = await prisma.boardColumn.create({
    data: { boardId: board.id, title: "In Progress", position: 1 },
  });
  const done = await prisma.boardColumn.create({
    data: { boardId: board.id, title: "Done", position: 2 },
  });

  await prisma.card.createMany({
    data: [
      {
        boardId: board.id,
        columnId: todo.id,
        title: "Lebenslauf aktualisieren",
        description: "CV aktualisieren und hochladen",
        status: "open",
      },
      {
        boardId: board.id,
        columnId: doing.id,
        title: "Follow-up schreiben",
        description: "Follow-up Mail für Bewerbung ACME",
        status: "in_progress",
      },
      {
        boardId: board.id,
        columnId: done.id,
        title: "Interview Vorbereitung",
        description: "Fragenkatalog durchgehen",
        status: "done",
      },
    ],
  });

  await prisma.boardMember.create({
    data: {
      boardId: board.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  console.log("Seed complete: Demo Board erstellt für Benutzer", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
