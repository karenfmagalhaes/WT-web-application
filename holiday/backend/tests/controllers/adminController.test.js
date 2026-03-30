import { describe, it, expect, vi } from 'vitest';
import { isAdmin } from '../../controllers/adminController.js';
import { getSuggestions } from '../../controllers/adminController.js';
const createMockRes = () => { //mock function to create a fake response object for testing
	const res = {}; // start with an empty object
	res.status = vi.fn().mockReturnValue(res); // vi.fn creates a fake trackable function, mockReturnValue allows chaining by returning the res object
	res.json = vi.fn().mockReturnValue(res); // mock the json method similarly to allow chaining
	return res; // return fake response object
};

describe('isAdmin', () => { // Test case for when there is no session user
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

