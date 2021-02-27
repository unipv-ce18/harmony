import 'regenerator-runtime/runtime';   // for Babel to polyfill "async"

import {mount} from 'enzyme';
import waitForExpect from 'wait-for-expect';

import '../../matchMedia.mock';

import LibraryPage from '../../../src/components/library/LibraryPage';
import {getLibrary, getUserInfo, getUserPlaylists} from '../../../src/core/apiCalls';


jest.mock('../../../src/core/Session', () => ({
  Session: jest.fn().mockImplementation(() => ({
      getAccessToken: jest.fn().mockResolvedValue('MOCK_ACCESS_TOKEN'),
      addStatusListener: jest.fn()
  }))
}));
jest.mock('../../../src/core/apiCalls');
getUserInfo.mockResolvedValue({});
getUserPlaylists.mockResolvedValue([{id: 'aaa', name: 'aaa'}]);

getLibrary.mockResolvedValue(require('./test-library.json'));


describe('LibraryPage', () => {
  beforeEach(() => {
    getLibrary.mockClear();
  });

  it('should display the user\'s library', async () => {
    const wrapper = mount(<LibraryPage id="me"/>)

    // Expands all the sections
    wrapper.setState({
      artists: true,
      playlists: true,
      releases: true,
      songs: true
    });

    await waitForExpect(() => {
      expect(getLibrary).toHaveBeenCalledTimes(1);
      expect(getLibrary).toHaveBeenCalledWith('me', 'MOCK_ACCESS_TOKEN', true);
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
