import { Router, type Request, type Response } from "express";
import { prisma } from "../../prisma.js";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

router.get("/", async (req: Request, res: Response) => {
    const { token, email } = req.query;

    if (!token || !email) return res.status(400).send("Missing token or email");

    const record = await prisma.verificationToken.findUnique({
        where: {
            identifier_token: {
                identifier: email as string,
                token: token as string,
            },
        },
    });

    if (!record || record.expires < new Date()) {
        return res.status(400).send("Invalid or expired token.");
    }

    // Update user
    const user = await prisma.user.update({
        where: { email: email as string },
        data: { emailVerified: new Date() },
    });

    // Delete token
    await prisma.verificationToken.delete({
        where: {
            identifier_token: {
                identifier: email as string,
                token: token as string,
            },
        },
    });

    // Log user in
    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", jwtToken, { httpOnly: true, secure: true });

    return res.redirect("/dashboard");
});

export default router;
