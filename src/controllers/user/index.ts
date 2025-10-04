import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';


const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response) => {
    console.log('sopra la panca la capra campa');
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await prisma.user.create({
            data: {
                email,
                name,
            },
        });

        return res.status(201).json(user);
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        return res.status(200).json({
            users,
            hello: 'Fudge'
        }
        );
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};