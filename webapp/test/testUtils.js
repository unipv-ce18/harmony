export function fillField(nodeWrap, value) {
  nodeWrap.getDOMNode().value = value;
  nodeWrap.simulate('change');
}
