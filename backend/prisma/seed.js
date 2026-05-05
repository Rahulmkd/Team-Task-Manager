import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create users
  const alice = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: hashedPassword,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "bob@example.com",
      password: hashedPassword,
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: "Carol Davis",
      email: "carol@example.com",
      password: hashedPassword,
    },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Complete overhaul of the company website with new branding",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Mobile App v2",
      description: "Second version of the mobile application with new features",
    },
  });

  // Add members to projects
  await prisma.projectMember.createMany({
    data: [
      { userId: alice.id, projectId: project1.id, role: "ADMIN" },
      { userId: bob.id, projectId: project1.id, role: "MEMBER" },
      { userId: carol.id, projectId: project1.id, role: "MEMBER" },
      { userId: bob.id, projectId: project2.id, role: "ADMIN" },
      { userId: alice.id, projectId: project2.id, role: "MEMBER" },
    ],
  });

  // Create tasks
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  await prisma.task.createMany({
    data: [
      {
        title: "Design new homepage layout",
        description: "Create wireframes and mockups for the new homepage",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: nextWeek,
        projectId: project1.id,
        assigneeId: carol.id,
        creatorId: alice.id,
      },
      {
        title: "Setup CI/CD pipeline",
        description: "Configure automated testing and deployment",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: nextMonth,
        projectId: project1.id,
        assigneeId: bob.id,
        creatorId: alice.id,
      },
      {
        title: "Write content for About page",
        description: "Create compelling copy for the about us section",
        status: "DONE",
        priority: "LOW",
        dueDate: yesterday,
        projectId: project1.id,
        assigneeId: alice.id,
        creatorId: alice.id,
      },
      {
        title: "Fix login bug",
        description: "Users are getting logged out after 5 minutes",
        status: "TODO",
        priority: "URGENT",
        dueDate: yesterday,
        projectId: project1.id,
        assigneeId: bob.id,
        creatorId: alice.id,
      },
      {
        title: "Implement push notifications",
        description: "Add push notification support for iOS and Android",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: nextWeek,
        projectId: project2.id,
        assigneeId: alice.id,
        creatorId: bob.id,
      },
      {
        title: "Performance optimization",
        description: "Reduce app load time by 50%",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: nextMonth,
        projectId: project2.id,
        assigneeId: bob.id,
        creatorId: bob.id,
      },
    ],
  });

  console.log(" Database seeded successfully!");
  console.log("\n Test Credentials:");
  console.log("  alice@example.com / password123 (Admin on Website Redesign)");
  console.log("  bob@example.com / password123 (Admin on Mobile App v2)");
  console.log("  carol@example.com / password123 (Member)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
