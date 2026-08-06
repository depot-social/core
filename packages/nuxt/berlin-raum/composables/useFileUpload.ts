import type { UploadedImage } from '@depot/shared';
import type { UploadedFile } from '~/berlin-raum/components/resource-form/UploadedFile';
import { createUploadedFile } from '~/berlin-raum/components/resource-form/UploadedFile';

export interface UseFileUploadOptions {
  getList: () => UploadedFile[];
  setList: (list: UploadedFile[]) => void;
}

export const useFileUpload = ({ getList, setList }: UseFileUploadOptions) => {
  const strapiUrl = useStrapiUrl();
  const abortControllers = ref<Map<string, AbortController>>(new Map());

  const fileSignature = (file: File): string =>
    `${file.name}-${file.type}-${file.size}-${file.lastModified}`;

  const buildUploadFormData = (file: File): FormData => {
    const formData = new FormData();
    formData.append('files', file, file.name);
    formData.append(
      'fileInfo',
      JSON.stringify({
        name: file.name.replace(/\.[^.]+$/, ''),
        alternativeText: file.name,
        caption: '',
      })
    );

    return formData;
  };

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object' && 'data' in err) {
      const msg = (err as { data?: { error?: { message?: string } } }).data
        ?.error?.message;
      if (msg) return msg;
    }
    return 'Netzwerkfehler';
  };

  const updateItemByKey = (
    key: string,
    updater: (item: UploadedFile) => UploadedFile
  ): void => {
    const list = [...getList()];
    const idx = list.findIndex((u) => (u._key ?? '') === key);
    if (idx === -1) return;
    const current = list[idx];
    if (!current) return;
    list[idx] = updater(current);
    setList(list);
  };

  const dropAbortController = (key: string): void => {
    abortControllers.value.delete(key);
  };

  const uploadFile = async (item: UploadedFile): Promise<void> => {
    const key = item._key ?? '';
    const controller = new AbortController();
    abortControllers.value.set(key, controller);

    try {
      const uploadedImages = await $fetch<UploadedImage[]>(
        `${strapiUrl}/upload`,
        {
          method: 'POST',
          body: buildUploadFormData(item.file),
          signal: controller.signal,
        }
      );

      const uploadedImage = uploadedImages[0];
      if (!uploadedImage) return;

      const id = uploadedImage.id;
      updateItemByKey(key, (current) =>
        id != null
          ? { ...current, id, error: null }
          : { ...current, error: 'Ungültige Antwort vom Server' }
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      updateItemByKey(key, (current) => ({
        ...current,
        error: getErrorMessage(err),
      }));
    } finally {
      dropAbortController(key);
    }
  };

  const onFilesChange = (files: File[]): void => {
    const currentSignatures = new Set(files.map(fileSignature));

    const keptItems = getList().filter((item) =>
      currentSignatures.has(fileSignature(item.file))
    );
    const removedItems = getList().filter(
      (item) => !currentSignatures.has(fileSignature(item.file))
    );

    for (const item of removedItems) {
      const key = item._key ?? '';
      abortControllers.value.get(key)?.abort();
      dropAbortController(key);
    }

    const newFiles = files.filter(
      (file) =>
        !keptItems.some(
          (item) => fileSignature(item.file) === fileSignature(file)
        )
    );
    const newItems = newFiles.map(createUploadedFile);
    const mergedList = [...keptItems, ...newItems];

    setList(mergedList);

    for (const item of newItems) {
      uploadFile(item);
    }
  };

  onScopeDispose(() => {
    abortControllers.value.forEach((c) => c.abort());
  });

  return { onFilesChange };
};
