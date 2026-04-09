import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMySuggestions, addSuggestion, deleteSuggestion } from '../../controllers/suggestionController.js';
import Suggestion from '../../models/Suggestion.js';

vi.mock('../../models/Suggestion.js');

const createMockRes = () => {
	const res = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

beforeEach(() => {
	// Reset mock state between test cases
	vi.clearAllMocks();
});

describe('getMySuggestions', () => { // test case for getting suggestions submitted by the user
	it('returns 401 when user is not logged in', async () => { // returns error when user is not logged in
		const req = { session: {} };
		const res = createMockRes();

		await getMySuggestions(req, res);

		expect(Suggestion.find).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'You must be logged in to view your suggestions.'
		});
	});

	it('returns 200 with suggestions sorted by newest first', async () => { // returns suggestions to the user by newest added
		const req = { session: { user: { id: 'user123' } } };
		const res = createMockRes();

		const mockSuggestions = [ // Mock suggestions returned from the database
			{ _id: 's1', name: 'Holiday A', submittedBy: 'user123' },
			{ _id: 's2', name: 'Holiday B', submittedBy: 'user123' }
		];

		const sortMock = vi.fn().mockResolvedValue(mockSuggestions);
		Suggestion.find = vi.fn().mockReturnValue({ sort: sortMock });

		await getMySuggestions(req, res);

		expect(Suggestion.find).toHaveBeenCalledWith({ submittedBy: 'user123' });
		expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 }); // Verify sorting by newest first
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Suggestions retrieved successfully.',
			count: 2,
			suggestions: mockSuggestions
		});
	});

	it('returns 500 when query fails', async () => { // returns server error when database query fails unexpectedly
		const req = { session: { user: { id: 'user123' } } };
		const res = createMockRes();

		const sortMock = vi.fn().mockRejectedValue(new Error('Database failure'));
		Suggestion.find = vi.fn().mockReturnValue({ sort: sortMock });

		await getMySuggestions(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
	});
});

describe('addSuggestion', () => { // test case for submitting a new suggestion
	it('returns 401 when user is not logged in', async () => { // user must be logged in
		const req = { session: {}, body: {} };
		const res = createMockRes();

		await addSuggestion(req, res);

		expect(Suggestion).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'You must be logged in to submit a suggestion.'
		});
	});

	it('returns 400 when validation fails', async () => { // validation errors for missing required fields and invalid formats
		const req = {
			session: { user: { id: 'user123' } },
			body: {
				name: '',
				country: '',
				date: 'not-a-date',
				description: 'x'.repeat(501) // Exceeds max length for description
			}
		};
		const res = createMockRes();

		await addSuggestion(req, res);

		expect(Suggestion).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Validation failed.',
			errors: expect.objectContaining({
				name: 'Holiday name is required.',
				country: 'Country is required.',
				date: 'Date must be a valid date.',
				description: 'Description must be 500 characters or fewer.'
			})
		});
	});

	it('returns 201 and saves a suggestion successfully', async () => { // sucessfully saves a valid suggestion
		const req = {
			session: { user: { id: 'user123' } },
			body: {
				name: '  New Festival  ',
				country: '  Ireland  ',
				date: '2026-05-01',
				category: 'Cultural',
				description: '  Annual event  ',
				referenceLink: '  https://example.com/event  '
			}
		};
		const res = createMockRes();

		const savedSuggestion = { // mock suggestion after saved to db
			_id: 's1',
			submittedBy: 'user123',
			name: 'New Festival'
		};

		const saveMock = vi.fn().mockResolvedValue(savedSuggestion);
		Suggestion.mockImplementation(() => ({ save: saveMock }));

		await addSuggestion(req, res);

		expect(Suggestion).toHaveBeenCalledWith({
			submittedBy: 'user123',
			name: 'New Festival',
			country: 'Ireland',
			date: new Date('2026-05-01'),
			category: 'Cultural',
			description: 'Annual event',
			referenceLink: 'https://example.com/event',
			status: 'pending'
		});
		expect(saveMock).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Suggestion submitted successfully. It will be reviewed by an admin.',
			suggestion: savedSuggestion
		});
	});

	it('uses defaults for optional fields when category, description, and referenceLink are omitted', async () => { // optional fields are not provided, defaults are applied
		const req = {
			session: { user: { id: 'user123' } },
			body: {
				name: 'Spring Day',
				country: 'Ireland',
				date: '2026-03-20'
			}
		};
		const res = createMockRes();

		const saveMock = vi.fn().mockResolvedValue({ _id: 's2' });
		Suggestion.mockImplementation(() => ({ save: saveMock }));

		await addSuggestion(req, res);

		expect(Suggestion).toHaveBeenCalledWith({
			submittedBy: 'user123',
			name: 'Spring Day',
			country: 'Ireland',
			date: new Date('2026-03-20'),
			category: 'Other',
			description: undefined,
			referenceLink: undefined,
			status: 'pending'
		});
		expect(res.status).toHaveBeenCalledWith(201);
	});

	it('returns 500 when save fails', async () => { // returns server error when save function fails 
		const req = {
			session: { user: { id: 'user123' } },
			body: {
				name: 'Holiday X',
				country: 'Ireland',
				date: '2026-06-01'
			}
		};
		const res = createMockRes();

		const saveMock = vi.fn().mockRejectedValue(new Error('Database failure'));
		Suggestion.mockImplementation(() => ({ save: saveMock }));

		await addSuggestion(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
	});
});

describe('deleteSuggestion', () => { // delete suggestion test case
	it('returns 401 when user is not logged in', async () => {
		const req = { session: {}, params: { suggestionId: 's1' } };
		const res = createMockRes();

		await deleteSuggestion(req, res);

		expect(Suggestion.findOne).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'You must be logged in to delete a suggestion.'
		});
	});

	it('returns 404 when suggestion is not found', async () => {
		const req = {
			session: { user: { id: 'user123' } },
			params: { suggestionId: 'missing' }
		};
		const res = createMockRes();

		Suggestion.findOne = vi.fn().mockResolvedValue(null); // Simulate suggestion not found

		await deleteSuggestion(req, res);

		expect(Suggestion.findOne).toHaveBeenCalledWith({
			_id: 'missing',
			submittedBy: 'user123'
		});
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ message: 'Suggestion not found.' });
	});

	it('returns 400 when suggestion is not pending', async () => { // cannot delete a suggestion that has already been approved or rejected
		const req = {
			session: { user: { id: 'user123' } },
			params: { suggestionId: 's1' }
		};
		const res = createMockRes();

		Suggestion.findOne = vi.fn().mockResolvedValue({ status: 'approved' }); // mock aproved suggestion

		await deleteSuggestion(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Cannot delete a suggestion that has already been approved.'
		});
	});

	it('returns 200 when pending suggestion is deleted successfully', async () => { // successfully deletes a pending suggestion
		const req = {
			session: { user: { id: 'user123' } },
			params: { suggestionId: 's1' }
		};
		const res = createMockRes();

		const deleteOneMock = vi.fn().mockResolvedValue(undefined); // Mock deleteOne method on the suggestion 
		Suggestion.findOne = vi.fn().mockResolvedValue({
			status: 'pending',
			deleteOne: deleteOneMock
		});

		await deleteSuggestion(req, res);

		expect(deleteOneMock).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Suggestion deleted successfully.'
		});
	});

	it('returns 400 when suggestionId is invalid (CastError)', async () => {
		const req = {
			session: { user: { id: 'user123' } },
			params: { suggestionId: 'invalid-id' }
		};
		const res = createMockRes();

		const castError = new Error('Invalid ObjectId');
		castError.name = 'CastError';
		Suggestion.findOne = vi.fn().mockRejectedValue(castError);

		await deleteSuggestion(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Invalid suggestion ID.' });
	});

	it('returns 500 when query fails unexpectedly', async () => { // db failure 
		const req = {
			session: { user: { id: 'user123' } },
			params: { suggestionId: 's1' }
		};
		const res = createMockRes();

		Suggestion.findOne = vi.fn().mockRejectedValue(new Error('Database failure'));

		await deleteSuggestion(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ message: 'Server error.' });
	});
});
