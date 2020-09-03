const UPDATE_TIMEOUT_MS = 500;

/**
 * Calls the given function when the held value changes
 *
 * A debounce interval can be given to invoke the callback only when the value has stabilized
 */
class ResyncProperty<T> {

  private updateDebounce?: number;

  constructor(private _value: T,
    private readonly callback: () => void,
    private readonly debounceDelay: number = UPDATE_TIMEOUT_MS) { }

  public get value() {
    return this._value;
  }

  public set value(v: T) {
    if (v === this._value) return;
    this._value = v;

    if (this.debounceDelay > 0) {
      window.clearTimeout(this.updateDebounce);
      this.updateDebounce = window.setTimeout(this.callback, this.debounceDelay);
    } else {
      this.callback();
    }
  }

}

export default ResyncProperty;
