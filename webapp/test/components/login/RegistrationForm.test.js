import 'regenerator-runtime/runtime';   // for Babel to polyfill "async"

import {mount} from 'enzyme';
import waitForExpect from 'wait-for-expect';

import {execRegistration} from '../../../src/core/apiCalls';
import RegistrationForm from '../../../src/components/login/RegistrationForm';

import {mockSessionDoLogin} from './sessionMock';
jest.mock('../../../src/core/Session', () => require('./sessionMock').default);
jest.mock('../../../src/core/apiCalls');
execRegistration.mockResolvedValue(null);

import {fillField} from '../../testUtils';

describe('RegistrationForm', () => {
  beforeEach(() => {
    mockSessionDoLogin.mockClear();
    execRegistration.mockClear();
  });

  it('should register users and automatically log in', async () => {
    const userData = {name: 'JohnCena', pass: 'smackdown', mail: 'john.cena@unipv.it'};
    const wrapper = mount(<RegistrationForm/>);

    // Go to registration
    wrapper.find('.regLink a').simulate('click');

    fillField(wrapper.find('input[name="remail"]'), userData.mail);
    fillField(wrapper.find('input[name="rname"]'), userData.name);
    fillField(wrapper.find('input[name="rpsw1"]'), userData.pass);
    fillField(wrapper.find('input[name="rpsw2"]'), userData.pass);
    wrapper.find('.regisForm').simulate('submit');

    expect(execRegistration).toHaveBeenCalledTimes(1);
    expect(execRegistration).toHaveBeenCalledWith(userData.mail, userData.name, userData.pass);

    // Wait for the registration promise to resolve
    await waitForExpect(() => {
      expect(mockSessionDoLogin).toHaveBeenCalledTimes(1);
      expect(mockSessionDoLogin).toHaveBeenCalledWith(userData.name, userData.pass);
    });
  });

  it('should not register when passwords are different', () => {
    const userData = {name: 'RandySavage', pass: 'boilingpoint', mail: 'randy.savage@unipv.it'};
    const wrapper = mount(<RegistrationForm/>);

    wrapper.find('.regLink a').simulate('click');

    fillField(wrapper.find('input[name="remail"]'), userData.mail);
    fillField(wrapper.find('input[name="rname"]'), userData.name);
    fillField(wrapper.find('input[name="rpsw1"]'), userData.pass);
    fillField(wrapper.find('input[name="rpsw2"]'), userData.pass + 'different');
    wrapper.find('.regisForm').simulate('submit');

    expect(execRegistration).not.toHaveBeenCalled();
    expect(wrapper.state()).toMatchObject({error: {type: 'pass2E'}});
  });
});
