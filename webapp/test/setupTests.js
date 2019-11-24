import {h} from 'preact';
import {configure} from 'enzyme';
import Adapter from 'enzyme-adapter-preact-pure';

configure({adapter: new Adapter()});

global.__h = h;
