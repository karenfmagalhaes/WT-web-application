import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addSavedHoliday } from '../controllers/favouriteController.js';
import Favourite from '../models/Favourite.js';
import Holiday from '../models/Holiday.js';

vi.mock('../models/Favourite.js');
vi.mock('../models/Holiday.js');

const createMockRes = () => { 
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

beforeEach(() => { // Clear all mocks before each test to ensure test isolation
	vi.clearAllMocks();
});

describe('addSavedHoliday', () => { // Test for saving a holiday to favourites
	it('returns 401 when the user is not logged in', async () => { // Test case for missing session user
		const req = {
			session: {},
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'You must be logged in to save a holiday.'
		});
	});

	it('returns 400 when holidayId is missing', async () => { // Test case for validation failure
		const req = {
			session: { user: { id: 'user123' } },
			body: {}
		};
		const res = createMockRes();

		await addSavedHoliday(req, res);

		expect(Holiday.findById).not.toHaveBeenCalled(); // The database should not be queried if validation fails
		expect(Favourite.create).not.toHaveBeenCalled(); // No attempt to save should be made if validation fails
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Validation failed.',
			errors: { holidayId: 'Holiday ID is required.' }
		});
	});

	it('returns 404 when the holiday does not exist', async () => { // Test case for a holiday that does not exist in the database
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		Holiday.findById = vi.fn().mockResolvedValue(null); // simulate holiday not found

		await addSavedHoliday(req, res);

		expect(Holiday.findById).toHaveBeenCalledWith('holiday123'); //check if holiday exists in the database
		expect(Favourite.create).not.toHaveBeenCalled(); // No attempt to save should be made if the holiday does not exist
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holiday not found.'
		});
	});

	it('returns 201 and saves the holiday successfully', async () => { // Test case for a successfull holiday save
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		const savedHoliday = { // mock saved holiday 
			_id: 'saved123',
			user: 'user123',
			holiday: 'holiday123',
			populate: vi.fn().mockResolvedValue(undefined) 
		};

		Holiday.findById = vi.fn().mockResolvedValue({ _id: 'holiday123' }); // simulate holiday exists
		Favourite.create = vi.fn().mockResolvedValue(savedHoliday); // simulate successful save

		await addSavedHoliday(req, res);

		expect(Holiday.findById).toHaveBeenCalledWith('holiday123');
		expect(Favourite.create).toHaveBeenCalledWith({ // Check that the save is attempted with the correct user and holiday IDs
			user: 'user123',
			holiday: 'holiday123'
		});
		expect(savedHoliday.populate).toHaveBeenCalledWith('holiday'); // Check that the holiday details are populated before returning
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holiday saved to favourites.',
			savedHoliday
		});
	});

	it('returns 409 when the holiday is already in favourites', async () => { // Test case for duplicate save attempt
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		Holiday.findById = vi.fn().mockResolvedValue({ _id: 'holiday123' });
		Favourite.create = vi.fn().mockRejectedValue({ code: 11000 }); // simulate duplicate key error from MongoDB

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(409);
		expect(res.json).toHaveBeenCalledWith({
			message: 'This holiday is already in your favourites.'
		});
	});

	it('returns 400 when the holiday ID is invalid', async () => { // Test case for invalid MongoDB ID
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'invalid-id' } // This should trigger a CastError when the controller tries to find the holiday by ID
		};
		const res = createMockRes();

		const castError = new Error('CastError'); // Simulate a CastError thrown by Mongoose when an invalid ID is used
		castError.name = 'CastError'; // Set the name property to identify it as a CastError

		Holiday.findById = vi.fn().mockRejectedValue(castError); // simulate database throwing a CastError

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Invalid holiday ID.'
		});
	});

	it('returns 500 when the database throws an unexpected error', async () => { // Test case for a generic server error
		const req = {
			session: { user: { id: 'user123' } },
			body: { holidayId: 'holiday123' }
		};
		const res = createMockRes();

		Holiday.findById = vi.fn().mockRejectedValue(new Error('Database error'));

		await addSavedHoliday(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Server error.'
		});
	});
});
