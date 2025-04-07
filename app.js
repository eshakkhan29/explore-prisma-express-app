const express = require("express");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  res.json({ message: "Hello World" });
});

app.post("/users", async (req, res) => {
  const { name, phone, age, gender, fatherId, motherId, siblingsIds } =
    req.body;
  try {
    // Check if the phone number already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        phone: phone, // Check if a user with this phone already exists
      },
    });

    if (existingUser) {
      // If a user with the same phone number exists, return an error
      return res.status(400).json({ message: "Phone number already exists" });
    }

    // Proceed with creating the new user if phone is unique
    const newUser = await prisma.user.create({
      data: {
        name: name,
        phone: phone,
        age: age,
        gender: gender,
        father: {
          connect: { id: fatherId },
        },
        mother: {
          connect: { id: motherId },
        },
        siblings: {
          connect: siblingsIds?.map((id) => ({ id: id })) || [],
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        father: true,
        mother: true,
        siblings: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      age: true,
      phone: true,
      father: {
        select: {
          id: true,
          name: true,
          age: true,
          phone: true,
        },
      },
      mother: {
        select: {
          id: true,
          name: true,
          age: true,
          phone: true,
        },
      },
      siblings: {
        select: {
          id: true,
          name: true,
          age: true,
          phone: true,
        },
      },
    },
  });
  res.json(users);
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
