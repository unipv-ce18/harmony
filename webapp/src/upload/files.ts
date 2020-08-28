// TODO may want to include also cover.jpg and friends
const FILE_FILTER = (f: File) => f.name.endsWith('.flac');

export function fromFileDialog(e: Event) {
  return Array.from((e.target as HTMLInputElement).files!).filter(FILE_FILTER);
}

export function fromDropEvent(e: DragEvent): Promise<File[]> {
  return new Promise(resolve => {
    const files: Array<File> = [];

    function addEntry(entry: any /* FileSystemFileEntry | FileSystemDirectoryEntry */): Promise<void> | undefined {
      if (entry.isFile) {
        if (FILE_FILTER(entry))
          return new Promise(r => entry.file((f: File) => {files.push(f); r()}));
        return undefined;

      } else if (entry.isDirectory) {
        return new Promise(r => {
          const reader = entry.createReader();
          reader.readEntries((entries: any[]) => {
            Promise.all(entries.map(e => addEntry(e))).then(() => r())
          });
        });
      }
    }

    Promise.all(
      Array.from(e.dataTransfer!.items)
        .filter(f => f.kind === 'file')
        .map(f => addEntry(f.webkitGetAsEntry()))
    ).then(() => resolve(files));
  });
}
