I have finally decided to also track UI icons within our repository since:

- The [`material-design-icons`](https://github.com/google/material-design-icons) repo, which can be pulled by NPM,
  seems to be outdated and does not contain _Rounded_ icons;

- It is better to avoid icon fonts in favor of SVG spritemaps, where we can pack and send only the icons we are going
  to use; 

To maintain visual consistency, prefer using _**Rounded** Material Design Icons_; you can download them from
[here](https://material.io/resources/icons/?style=round) and add an entry for them to be used in `icons.js`.
