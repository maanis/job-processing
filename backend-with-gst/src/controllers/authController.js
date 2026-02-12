const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/ClientModel');

const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Normalize role, default to 'user'
        const roleToUse = role === 'admin' ? 'admin' : 'user';

        // Check if client already exists
        const existingClient = await Client.findOne({ username });
        if (existingClient) {
            return res.status(400).json({ error: 'Username already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new client (accept role, default to 'user')
        const client = new Client({
            username,
            password: hashedPassword,
            role: roleToUse
        });

        await client.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: client._id, username: client.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Client registered successfully',
            token,
            client: {
                id: client._id,
                username: client.username,
                role: client.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find client by username
        const client = await Client.findOne({ username });
        if (!client) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if client is active
        if (!client.isActive) {
            return res.status(401).json({ error: 'Account is inactive' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, client.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        client.lastLoginAt = new Date();
        await client.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: client._id, username: client.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            client: {
                id: client._id,
                username: client.username,
                role: client.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const logout = (req, res) => {
    try {
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const isAuthenticated = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader) {
            return res.json({ authenticated: false });
        }

        const token = authHeader.split(" ")[1]; // "Bearer <token>"

        if (!token) {
            return res.json({ authenticated: false });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Check if client still exists and is active
            const client = await Client.findById(decoded.id);
            if (!client || !client.isActive) {
                return res.json({ authenticated: false });
            }

            res.json({
                authenticated: true,
                client: {
                    id: client._id,
                    username: client.username,
                    role: client.role
                }
            });
        } catch (error) {
            return res.json({ authenticated: false });
        }
    } catch (error) {
        console.error('Authentication check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, logout, isAuthenticated };