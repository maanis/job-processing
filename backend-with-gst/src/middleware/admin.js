const Client = require('../models/ClientModel');

const admin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const client = await Client.findById(req.user.id);
        if (!client) return res.status(401).json({ error: 'Unauthorized' });

        if (client.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: admin only' });
        }

        // attach client to request for downstream use
        req.client = client;
        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = admin;
