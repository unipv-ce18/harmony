import 'regenerator-runtime/runtime';   // for Babel to polyfill "async"

import {mount} from 'enzyme';
import waitForExpect from 'wait-for-expect';

import {execRegistration} from '../../../src/core/apiCalls';
import {FieldType} from '../../../src/components/login/validation';
import LoginForm from '../../../src/components/login/LoginForm';

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
    const wrapper = mount(<LoginForm registration={true}/>);

    fillField(wrapper.find('input[name="fieldEmail"]'), userData.mail);
    fillField(wrapper.find('input[name="fieldUsername"]'), userData.name);
    fillField(wrapper.find('input[name="fieldPassword1"]'), userData.pass);
    fillField(wrapper.find('input[name="fieldPassword2"]'), userData.pass);
    wrapper.find('.registrationForm').simulate('submit');

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
    const wrapper = mount(<LoginForm registration={true}/>);

    fillField(wrapper.find('input[name="fieldEmail"]'), userData.mail);
    fillField(wrapper.find('input[name="fieldUsername"]'), userData.name);
    fillField(wrapper.find('input[name="fieldPassword1"]'), userData.pass);
    fillField(wrapper.find('input[name="fieldPassword2"]'), userData.pass + 'different');
    wrapper.find('.registrationForm').simulate('submit');

    expect(execRegistration).not.toHaveBeenCalled();
    expect(wrapper.state()).toMatchObject({error: {type: FieldType.PASSWORD_2}});
  });
});
