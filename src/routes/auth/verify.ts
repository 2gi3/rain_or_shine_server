import { ENV } from "../../env.js";
import { Router, type Request, type Response } from "express";
import { prisma } from "../../prisma.js";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = ENV.JWT_SECRET!;
const CLIENT_URL = ENV.CLIENT_URL;

router.get("/", async (req: Request, res: Response) => {

    try {
        const { token, email } = req.query;

        if (!token || !email) {
            return res.status(400).send("Missing token or email");
        }

        if (Array.isArray(email) || Array.isArray(token)) {
            return res.status(400).send("Invalid query params");
        }

        // ✅ Find matching verification token
        const record = await prisma.verificationToken.findUnique({
            where: {
                identifier_token: {
                    identifier: email as string,
                    token: token as string,
                },
            },
        });

        // ✅ Check if token exists or expired
        if (!record || record.expires < new Date()) {
            return res.status(400).send("Invalid or expired verification token.");
        }

        // ✅ Mark user as verified
        const user = await prisma.user.update({
            where: { email: email as string },
            data: { emailVerified: new Date() },
        });

        // ✅ Delete used verification token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email as string,
                    token: token as string,
                },
            },
        });

        // ✅ Generate JWT for automatic login
        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ Redirect user to your client (frontend) with the token
        const redirectUrl = `${CLIENT_URL}?token=${jwtToken}`;
        return res.redirect(302, redirectUrl);
    } catch (error) {
        console.error("Error during email verification:", error);
        return res.status(500).send("Internal server error");
    }
});

export default router;

