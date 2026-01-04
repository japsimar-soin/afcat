"""
Database connection and Prisma client setup
"""

import os
from prisma import Prisma
from prisma.client import ClientSession

# Global Prisma client instance
prisma: Prisma | None = None


async def get_prisma() -> Prisma:
    """Get or create Prisma client instance"""
    global prisma
    if prisma is None:
        prisma = Prisma()
        await prisma.connect()
    return prisma


async def disconnect_prisma():
    """Disconnect Prisma client"""
    global prisma
    if prisma is not None:
        await prisma.disconnect()
        prisma = None
