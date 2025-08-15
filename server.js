require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
  origin: [
    'https://voteuz.netlify.app',
    'https://voting-iota-gold.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Quantum MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://refbot:refbot00@gamepaymentbot.ffcsj5v.mongodb.net/voting?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('⚡ Connected to Quantum MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Connection events
mongoose.connection.on('connecting', () => console.log('MongoDB-ga ulanmoqda...'));
mongoose.connection.on('connected', () => console.log('MongoDB-ga ulandi!'));
mongoose.connection.on('disconnected', () => console.log('MongoDB ulanmadi!'));
mongoose.connection.on('error', (err) => console.log('MongoDB xatosi:', err));

// Quantum Poll Schema
const pollSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    mediaUrl: { type: String, trim: true },
    mediaType: { type: String, enum: ['image', 'video', 'hologram', 'none'], default: 'none' },
    options: [{
        id: { type: String, default: uuidv4 },
        text: { type: String, required: true, trim: true },
        votes: { type: Number, default: 0 },
        voters: [{ type: String }] // For future voter verification
    }],
    creator: { type: String, default: 'anonymous' },
    shortUrl: { type: String },
    isActive: { type: Boolean, default: true },
    quantumSignature: { type: String } // For future quantum encryption
}, { timestamps: true, _id: false });

const Poll = mongoose.model('Poll', pollSchema);

// Quantum Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1y',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Quantum Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500 // limit each IP to 500 requests per windowMs
});
app.use(limiter);

// Quantum API Routes
app.get('/api/polls', async (req, res) => {
    try {
        const { search, limit = 20, page = 1 } = req.query;
        const query = search ? {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ],
            isActive: true
        } : { isActive: true };

        const polls = await Poll.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Poll.countDocuments(query);

        res.json({
            success: true,
            data: polls,
            meta: {
                total,
                pages: Math.ceil(total / parseInt(limit)),
                page: parseInt(page)
            }
        });
    } catch (err) {
        console.error('🌌 Quantum retrieval error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Quantum fluctuation detected. Try again.' 
        });
    }
});

app.post('/api/polls', async (req, res) => {
    try {
        const { title, description, mediaUrl, mediaType, options } = req.body;
        
        if (!title || !options || options.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Title and at least 2 options required'
            });
        }

        const poll = new Poll({
            title,
            description,
            mediaUrl,
            mediaType,
            options: options.map(opt => ({ text: opt })),
            shortUrl: `${process.env.BASE_URL}/p/${uuidv4()}`
        });

        await poll.save();

        res.status(201).json({
            success: true,
            data: poll
        });
    } catch (err) {
        console.error('🌌 Quantum creation error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Quantum entanglement failed. Try again.' 
        });
    }
});

// Ovoz berish endpointini to'g'rilash
app.post('/api/polls/:id/vote', async (req, res) => {
    try {
        const { optionId } = req.body; // Faqat optionId qabul qilamiz
        
        if (!optionId) {
            return res.status(400).json({
                success: false,
                error: 'optionId is required'
            });
        }

        const poll = await Poll.findById(req.params.id);
        if (!poll || !poll.isActive) {
            return res.status(404).json({
                success: false,
                error: 'Poll not found or inactive'
            });
        }

        const option = poll.options.find(opt => opt.id === optionId);
        if (!option) {
            return res.status(400).json({
                success: false,
                error: 'Invalid optionId'
            });
        }

        option.votes += 1;
        await poll.save();

        res.json({
            success: true,
            data: poll
        });
    } catch (err) {
        console.error('Voting error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// Quantum Preview Endpoint
app.get('/p/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll || !poll.isActive) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Poll Not Found</title>
                    <meta property="og:title" content="Poll Not Found" />
                    <meta property="og:description" content="This quantum poll has collapsed or doesn't exist" />
                </head>
                <body>
                    <h1>Poll Not Found</h1>
                    <p>This quantum poll has collapsed or doesn't exist</p>
                </body>
                </html>
            `);
        }

        const userAgent = req.get('user-agent').toLowerCase();
        const isBot = userAgent.includes('telegrambot') || 
                      userAgent.includes('twitterbot') || 
                      userAgent.includes('whatsapp') ||
                      userAgent.includes('facebookexternalhit');

        if (isBot) {
            const html = `
                <!DOCTYPE html>
                <html prefix="og: https://ogp.me/ns#">
                <head>
                    <title>${poll.title}</title>
                    <meta property="og:title" content="${poll.title}" />
                    <meta property="og:description" content="${poll.description || 'Cast your quantum vote now!'}" />
                    <meta property="og:url" content="${poll.shortUrl}" />
                    <meta property="og:type" content="website" />
                    ${poll.mediaType === 'image' || poll.mediaType === 'hologram' ? 
                        `<meta property="og:image" content="${poll.mediaUrl}" />` : ''}
                    ${poll.mediaType === 'video' ? 
                        `<meta property="og:video" content="${poll.mediaUrl}" />` : ''}
                    <meta name="twitter:card" content="${poll.mediaType === 'image' ? 'summary_large_image' : 'summary'}">
                    <meta name="theme-color" content="#00f0ff">
                </head>
                <body style="background: #0a0a12; color: #e0e0ff; font-family: sans-serif; padding: 20px;">
                    <div style="max-width: 800px; margin: 0 auto;">
                        <h1 style="color: #00f0ff; font-size: 2em;">${poll.title}</h1>
                        ${poll.description ? `<p style="font-size: 1.2em;">${poll.description}</p>` : ''}
                        ${poll.mediaType === 'image' || poll.mediaType === 'hologram' ? 
                            `<img src="${poll.mediaUrl}" alt="${poll.title}" style="max-width: 100%; border-radius: 8px; margin: 20px 0;">` : ''}
                        ${poll.mediaType === 'video' ? 
                            `<video src="${poll.mediaUrl}" controls style="max-width: 100%; border-radius: 8px; margin: 20px 0;"></video>` : ''}
                        <a href="${poll.shortUrl}" style="display: inline-block; background: #00f0ff; color: #0a0a12; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; margin-top: 20px;">
                            Vote Now
                        </a>
                    </div>
                </body>
                </html>
            `;
            res.send(html);
        } else {
            res.redirect(`/#poll-${poll._id}`);
        }
    } catch (err) {
        console.error('🌌 Quantum preview error:', err);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quantum Error</title>
            </head>
            <body>
                <h1>Quantum Fluctuation Detected</h1>
                <p>Try again later</p>
            </body>
            </html>
        `);
    }
});

// Quantum Admin Endpoints
app.put('/api/quantum/polls/:id', async (req, res) => {
    try {
        // Future: Add quantum authentication
        const poll = await Poll.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!poll) {
            return res.status(404).json({
                success: false,
                error: 'Poll not found'
            });
        }

        res.json({
            success: true,
            data: poll
        });
    } catch (err) {
        console.error('🌌 Quantum update error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Quantum decoherence occurred' 
        });
    }
});

app.delete('/api/quantum/polls/:id', async (req, res) => {
    try {
        // Future: Add quantum authentication
        const poll = await Poll.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!poll) {
            return res.status(404).json({
                success: false,
                error: 'Poll not found'
            });
        }

        res.json({
            success: true,
            data: poll
        });
    } catch (err) {
        console.error('🌌 Quantum deletion error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Quantum collapse failed' 
        });
    }
});

// Quantum Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/poll/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Error Handler - O'zgartirilgan versiya
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global Error Handler - O'zgartirilgan versiya
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
    });
});

// Start Quantum Server
app.listen(PORT, () => {
    console.log(`🌠 Quantum server running on port ${PORT}`);
});
