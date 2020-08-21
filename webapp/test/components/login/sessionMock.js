export let mockSessionDoLogin;

export default {
  Session: jest.fn().mockImplementation(() => {
    mockSessionDoLogin = jest.fn()
      .mockResolvedValue(null);
    return {doLogin: mockSessionDoLogin, addStatusListener: jest.fn()};
  })
};
