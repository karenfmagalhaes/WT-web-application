import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHolidays, getHolidayById } from '../../controllers/holidayController.js';
import Holiday from '../../models/Holiday.js';

vi.mock('../../models/Holiday.js');

const createMockRes = () => {
	// Chainable Express response mock: res.status(...).json(...)
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

beforeEach(() => {
	// Reset all spies/mocks between test cases
	vi.clearAllMocks();
});

describe('getHolidays', () => { // Test for the getHolidays controller function
	it('returns all holidays when no filters are provided', async () => {
		const req = { query: {} };
		const res = createMockRes();
		const next = vi.fn();

		const mockHolidays = [ // mock holiday data 
			{ _id: 'h1', name: 'New Year', country: 'Ireland', month: 1 },
			{ _id: 'h2', name: 'Christmas', country: 'Ireland', month: 12 },
		];

		const sortMock = vi.fn().mockResolvedValue(mockHolidays); // Mock the sort function to return the mock holidays
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock }); // Mock the find function to return an object with a sort method that returns the mock holidays

		await getHolidays(req, res, next);

		expect(Holiday.find).toHaveBeenCalledWith({});
		expect(sortMock).toHaveBeenCalledWith({ month: 1, date: 1, name: 1 });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holidays retrieved successfully.',
			count: 2,
			holidays: mockHolidays,
		});
		expect(next).not.toHaveBeenCalled(); // next should not be called if there are no errors
	});

	it('applies country filter as case-insensitive exact match', async () => { // Test that the country filter is applied correctly as a case-insensitive exact match
		const req = { query: { country: 'Ireland' } };
		const res = createMockRes();
		const next = vi.fn();

		const sortMock = vi.fn().mockResolvedValue([]);
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock });

		await getHolidays(req, res, next);

		expect(Holiday.find).toHaveBeenCalledWith({
			country: new RegExp('^Ireland$', 'i'),
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holidays retrieved successfully.',
			count: 0,
			holidays: [],
		});
	});

	it('applies month, category, and search filters together', async () => {
		const req = { // Controller should cast month to number and build a regex search on name
			query: { month: '12', category: 'Public', search: 'christ' },
		};
		const res = createMockRes();
		const next = vi.fn();

		const mockHolidays = [
			{ _id: 'h2', name: 'Christmas Day', country: 'Ireland', month: 12, category: 'Public' },
		];

		const sortMock = vi.fn().mockResolvedValue(mockHolidays);
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock }); 

		await getHolidays(req, res, next);

		expect(Holiday.find).toHaveBeenCalledWith({
			month: 12,
			category: 'Public',
			name: { $regex: 'christ', $options: 'i' },
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holidays retrieved successfully.',
			count: 1,
			holidays: mockHolidays,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 400 when month is outside valid range', async () => { // test for when user inputs invalid month 
		const req = { query: { month: '13' } };
		const res = createMockRes();
		const next = vi.fn();

		await getHolidays(req, res, next);

		// Invalid month should short-circuit before any DB query
		expect(Holiday.find).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Month must be a number between 1 and 12.',
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 400 when category is invalid', async () => { // test for when user inputs invalid category
		const req = { query: { category: 'InvalidType' } };
		const res = createMockRes();
		const next = vi.fn();

		await getHolidays(req, res, next);

		expect(Holiday.find).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: expect.stringContaining('Invalid category. Must be one of:'),
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('calls next(error) when database query fails', async () => { // test that if the database query throws an unexpected error, it is passed to the next error-handling middleware
		const req = { query: {} };
		const res = createMockRes();
		const next = vi.fn();

		// In this controller, unexpected errors are delegated to Express error middleware
		const dbError = new Error('Database error');
		const sortMock = vi.fn().mockRejectedValue(dbError);
		Holiday.find = vi.fn().mockReturnValue({ sort: sortMock });

		await getHolidays(req, res, next);

		expect(next).toHaveBeenCalledWith(dbError);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});

describe('getHolidayById', () => { // Test suite for retrieving one holiday by its ID
	it('returns 200 and the holiday when a valid holiday exists', async () => { // happy path
		const req = { params: { holidayId: 'holiday123' } };
		const res = createMockRes();
		const next = vi.fn();

		const mockHoliday = {
			_id: 'holiday123',
			name: 'New Year',
			country: 'Ireland',
			month: 1,
		};

		// Simulate finding a matching holiday record
		Holiday.findById = vi.fn().mockResolvedValue(mockHoliday);

		await getHolidayById(req, res, next);

		expect(Holiday.findById).toHaveBeenCalledWith('holiday123');
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Holiday retrieved successfully.',
			holiday: mockHoliday,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 404 when holiday does not exist', async () => { // valid ID format but no record found
		const req = { params: { holidayId: 'missingHoliday' } }; 
		const res = createMockRes();
		const next = vi.fn();

		Holiday.findById = vi.fn().mockResolvedValue(null); // Simulate no holiday found with the given ID

		await getHolidayById(req, res, next);

		expect(Holiday.findById).toHaveBeenCalledWith('missingHoliday');
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ message: 'Holiday not found.' });
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 400 when holidayId is invalid (CastError)', async () => { // invalid Mongo ObjectId shape
		const req = { params: { holidayId: 'invalid-id' } };
		const res = createMockRes();
		const next = vi.fn();

		const castError = new Error('Invalid ObjectId');
		castError.name = 'CastError';
		Holiday.findById = vi.fn().mockRejectedValue(castError);

		await getHolidayById(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Invalid holiday ID.' });
		expect(next).not.toHaveBeenCalled();
	});

	it('calls next(error) for unexpected database errors', async () => { // ensures middleware chain handles generic failures
		const req = { params: { holidayId: 'holiday123' } };
		const res = createMockRes();
		const next = vi.fn();

		const dbError = new Error('Database failure');
		Holiday.findById = vi.fn().mockRejectedValue(dbError);

		await getHolidayById(req, res, next);

		expect(next).toHaveBeenCalledWith(dbError);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});
