import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/Suggestion.js', () => ({ // 
    default: {
        find: vi.fn()
    }
}));

import { isAdmin, getSuggestions } from '../../controllers/adminController.js';
import Suggestion from '../../models/Suggestion.js';

beforeEach(() => {
    vi.clearAllMocks(); // Clear mock history before each test to ensure tests are independent
});

const createMockRes = () => { // mock function to create a fake response object for testing
    const res = {}; // start with an empty object
    res.status = vi.fn().mockReturnValue(res); // vi.fn creates a fake trackable function, mockReturnValue allows chaining by returning the res object
    res.json = vi.fn().mockReturnValue(res); // mock the json method similarly to allow chaining
    return res; // return fake response object
};

const createMockReq = (data = {}) => ({ // mock function to create a fake request object for testing
    session: { user: { role: 'admin' } }, // default admin
    query: {},
    ...data
});

describe('isAdmin', () => { // Tests for access-control helper
    it('returns false and sends 401 when no session user exists', () => {
        const req = { session: {} };
        const res = createMockRes(); // mock response

        const result = isAdmin(req, res); // call function being tested

        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'You must be logged in.' });
    });

    it('returns false and sends 403 when user is not admin', () => { // test case for when user exists but is not admin
        const req = { session: { user: { role: 'user' } } };
        const res = createMockRes();

        const result = isAdmin(req, res); // call function being tested

        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
    });

    it('returns true and does not send a response when user is admin', () => { // test case for when user is admin
        const req = { session: { user: { role: 'admin' } } };
        const res = createMockRes();

        const result = isAdmin(req, res);

        expect(result).toBe(true);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});

describe('getSuggestions', () => {
    it('returns suggestions successfully for admin', async () => {
        const req = createMockReq(); // create mock request with default admin session
        const res = createMockRes(); // create mock response

        const mockSuggestions = [{ name: 'Test Holiday' }]; // mock data to be returned by the database query

        Suggestion.find.mockReturnValue({
            populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockResolvedValue(mockSuggestions)
            })
        });

        await getSuggestions(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(200); // 
        expect(res.json).toHaveBeenCalledWith({ // check that the response contains the expected data
            message: 'Suggestions retrieved successfully.',
            count: 1,
            suggestions: mockSuggestions
        });
    });

    it('returns 400 for invalid status', async () => { // test case for when an invalid status is provided in the query
        const req = createMockReq({
            query: { status: 'invalid' } // set invalid status in query
        });
        const res = createMockRes();

        await getSuggestions(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid status. Must be one of: pending, approved, rejected.'
        });
    });

    it('filters suggestions by status', async () => { // test filtering behavior
        const req = createMockReq({
            query: { status: 'pending' }
        });
        const res = createMockRes();

        const mockSuggestions = [{ status: 'pending' }];

        Suggestion.find.mockReturnValue({
            populate: vi.fn().mockReturnValue({
                sort: vi.fn().mockResolvedValue(mockSuggestions)
            })
        });

        await getSuggestions(req, res); // call function being tested

        expect(Suggestion.find).toHaveBeenCalledWith({ status: 'pending' }); // check that the database query was called with the correct filter
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on server error', async () => { // test case for when the database query throws an error
        const req = createMockReq();
        const res = createMockRes();

        Suggestion.find.mockImplementation(() => {
            throw new Error('Database error'); // simulate a database error
        });

        await getSuggestions(req, res); // call function being tested

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
    });
});


