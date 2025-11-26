import jwt from "jsonwebtoken";
import User from "../src/models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // petición a la base de datos (MongoDB) usando Mongoose
    const user = await User.findById(userId).select("name email rol telefono avatarUrl activo");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      rol: user.rol,
      telefono: user.telefono,
      avatarUrl: user.avatarUrl,
      activo: user.activo
    };
    next();
    
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
}

