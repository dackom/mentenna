import { prisma } from "@/lib/prisma";
import { Genre1, Genre2 } from "@prisma/client";

// Genre1 Operations
export async function getGenre1ByWrites(writes: string) {
  return await prisma.genre1.findMany({
    where: { writes },
    orderBy: { order: "asc" },
    include: {
      genre2Options: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getAllGenre1() {
  return await prisma.genre1.findMany({
    orderBy: [{ writes: "asc" }, { order: "asc" }],
    include: {
      genre2Options: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getGenre1ById(id: string) {
  return await prisma.genre1.findUnique({
    where: { id },
    include: {
      genre2Options: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function createGenre1(data: {
  name: string;
  writes: string;
  order?: number;
}) {
  // Get the highest order number for this writes category
  if (data.order === undefined) {
    const maxOrder = await prisma.genre1.aggregate({
      where: { writes: data.writes },
      _max: { order: true },
    });
    data.order = (maxOrder._max.order ?? -1) + 1;
  }

  return await prisma.genre1.create({
    data,
  });
}

export async function updateGenre1(
  id: string,
  data: Partial<Pick<Genre1, "name" | "writes" | "order">>
) {
  return await prisma.genre1.update({
    where: { id },
    data,
  });
}

export async function deleteGenre1(id: string) {
  return await prisma.genre1.delete({
    where: { id },
  });
}

// Genre2 Operations
export async function getGenre2ByGenre1(genre1Id: string) {
  return await prisma.genre2.findMany({
    where: { genre1Id },
    orderBy: { order: "asc" },
    include: {
      genre1: true,
    },
  });
}

export async function getGenre2ById(id: string) {
  return await prisma.genre2.findUnique({
    where: { id },
    include: {
      genre1: true,
    },
  });
}

export async function createGenre2(data: {
  name: string;
  genre1Id: string;
  order?: number;
}) {
  // Get the highest order number for this genre1
  if (data.order === undefined) {
    const maxOrder = await prisma.genre2.aggregate({
      where: { genre1Id: data.genre1Id },
      _max: { order: true },
    });
    data.order = (maxOrder._max.order ?? -1) + 1;
  }

  return await prisma.genre2.create({
    data,
  });
}

export async function updateGenre2(
  id: string,
  data: Partial<Pick<Genre2, "name" | "order">>
) {
  return await prisma.genre2.update({
    where: { id },
    data,
  });
}

export async function deleteGenre2(id: string) {
  return await prisma.genre2.delete({
    where: { id },
  });
}
