import { describe, it, expect, vi } from 'vitest';
import { getSession } from '../../controllers/authController.js';

const createMockRes = () => { // Helper function to create a mock response object
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('getSession', () => { // Test suite for the getSession function
    it('returns loggedIn true when session user exists', () => { // Test case for when a user is logged in
        const req = { // Mock request object with a session user
            session: { // Simulate a logged-in user in the session
                user: { // Mock user data
                    id: '123',
                    email: 'test@test.com',
                    firstName: 'John'
                }
            }
        };
        const res = createMockRes(); // Create a mock response object

        getSession(req, res); // Call the function being tested

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            loggedIn: true,
            user: req.session.user
        });
    });

    it('returns loggedIn false when session exists but no user is logged in', () => { // Test case for when the session exists but there is no logged-in user
        const req = { // Mock request object with an empty session user
            session: {}
        };
        const res = createMockRes();

        getSession(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ loggedIn: false });
    });

    it('returns loggedIn false when session does not exist', () => { // Test case for when the session does not exist
        const req = {}; // no session 
        const res = createMockRes();

        getSession(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ loggedIn: false });
    });
});