const express = require("express");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  res.json({ message: "Server is ok" });
});

// create a user
app.post("/users", async (req, res) => {
  const { name, phone, age, gender, fatherId, mother, siblingsIds } = req.body;
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
        mother: mother,
        father: {
          connect: { id: fatherId },
        },
        siblings: {
          connect: siblingsIds?.map((sibId) => ({ id: sibId })) || [],
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        name: true,
        age: true,
        mother: true,
        father: true,
        siblings: true,
        fatherId: false,
      },
    });

    res.status(200).json({
      message: "user created",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      age: true,
      phone: true,
      gender: true,
      mother: true,
      children: {
        select: {
          id: true,
          name: true,
          age: true,
          phone: true,
          gender: true,
        },
      },
      father: {
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
          gender: true,
        },
      },
      siblingOf: {
        select: {
          id: true,
          name: true,
          age: true,
          phone: true,
          gender: true,
        },
      },
    },
  });

  const mergedUsers = users.map((user) => {
    // Combine and remove duplicates by `id`
    const allSiblings = [...user.siblings, ...user.siblingOf];
    const uniqueSiblings = Array.from(
      new Map(allSiblings.map((s) => [s.id, s])).values()
    );

    return {
      id: user.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      mother: user.mother,
      father: user.father,
      children: user.children,
      siblings: uniqueSiblings,
    };
  });
  res.json(mergedUsers);
});

// get user by id
app.get("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        age: true,
        phone: true,
        gender: true,
        mother: true,
        children: {
          select: {
            id: true,
            name: true,
            age: true,
            phone: true,
            gender: true,
          },
        },
        father: {
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
            gender: true,
          },
        },
        siblingOf: {
          select: {
            id: true,
            name: true,
            age: true,
            phone: true,
            gender: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Merge siblings and siblingOf
    const allSiblings = [...user.siblings, ...user.siblingOf];
    const uniqueSiblings = Array.from(
      new Map(allSiblings.map((s) => [s.id, s])).values()
    );

    const userData = {
      id: user.id,
      name: user.name,
      age: user.age,
      phone: user.phone,
      gender: user.gender,
      mother: user.mother,
      father: user.father,
      siblings: uniqueSiblings,
      children: user.children,
    };

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
