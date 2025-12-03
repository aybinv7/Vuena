export interface ValidationRule<T = any> {
  validator: (value: T) => boolean | string;
  message?: string;
}

export interface FieldValidation {
  [field: string]: ValidationRule[];
}

/**
 * Reusable composable for form management
 *
 * Provides:
 * - Form state management
 * - Validation
 * - Error handling
 * - Dirty state tracking
 * - Auto-save support
 *
 * @example
 * ```typescript
 * const {
 *   form,
 *   errors,
 *   isDirty,
 *   validate,
 *   reset
 * } = useForm(
 *   { name: '', email: '' },
 *   {
 *     name: [{ validator: (v) => !!v, message: 'Required' }],
 *     email: [
 *       { validator: (v) => !!v, message: 'Required' },
 *       { validator: (v) => /\S+@\S+/.test(v), message: 'Invalid email' }
 *     ]
 *   }
 * );
 * ```
 */
export function useForm<T extends Record<string, any>>(
  initialData: T,
  validationRules?: FieldValidation,
  options?: {
    autoSave?: boolean;
    autoSaveDelay?: number;
    onSave?: (data: T) => Promise<void>;
  }
) {
  const form = reactive<T>({ ...initialData });
  const initialFormData = { ...initialData };
  const errors = ref<Record<string, string>>({});
  const touched = ref<Record<string, boolean>>({});
  const saving = ref(false);
  const autoSaveTimer = ref<ReturnType<typeof setTimeout> | null>(null);

  // Computed properties
  const isDirty = computed(() => {
    return Object.keys(form).some(
      (key) =>
        JSON.stringify(form[key]) !== JSON.stringify(initialFormData[key])
    );
  });

  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0;
  });

  const touchedFields = computed(() => {
    return Object.keys(touched.value).filter((key) => touched.value[key]);
  });

  /**
   * Validate a single field
   */
  function validateField(field: keyof T): boolean {
    if (!validationRules || !validationRules[field as string]) {
      return true;
    }

    const rules = validationRules[field as string];
    const value = (form as any)[field];

    if (!rules) return true;

    for (const rule of rules) {
      const result = rule.validator(value);

      if (result === false) {
        errors.value[field as string] = rule.message || "Invalid value";
        return false;
      }

      if (typeof result === "string") {
        errors.value[field as string] = result;
        return false;
      }
    }

    // Field is valid, remove error
    delete errors.value[field as string];
    return true;
  }

  /**
   * Validate all fields
   */
  function validate(): boolean {
    if (!validationRules) return true;

    errors.value = {};
    let isFormValid = true;

    for (const field of Object.keys(validationRules)) {
      if (!validateField(field as keyof T)) {
        isFormValid = false;
      }
    }

    return isFormValid;
  }

  /**
   * Mark field as touched
   */
  function touch(field: keyof T) {
    touched.value[field as string] = true;
    if (validationRules?.[field as string]) {
      validateField(field);
    }
  }

  /**
   * Mark all fields as touched
   */
  function touchAll() {
    Object.keys(form).forEach((key) => {
      touched.value[key] = true;
    });
  }

  /**
   * Reset form to initial state
   */
  function reset() {
    Object.keys(initialFormData).forEach((key) => {
      form[key] = initialFormData[key];
    });
    errors.value = {};
    touched.value = {};
    saving.value = false;
  }

  /**
   * Update initial data (useful after successful save)
   */
  function updateInitialData(data?: Partial<T>) {
    const newData = data ?? form;
    Object.keys(newData).forEach((key) => {
      (initialFormData as any)[key] = newData[key];
    });
  }

  /**
   * Set form values
   */
  function setValues(data: Partial<T>) {
    Object.keys(data).forEach((key) => {
      if (key in form) {
        form[key] = data[key];
      }
    });
  }

  /**
   * Set a single field value
   */
  function setValue<K extends keyof T>(field: K, value: T[K]) {
    (form as any)[field] = value;
  }

  /**
   * Set field error
   */
  function setError(field: keyof T, message: string) {
    errors.value[field as string] = message;
  }

  /**
   * Clear field error
   */
  function clearError(field: keyof T) {
    delete errors.value[field as string];
  }

  /**
   * Clear all errors
   */
  function clearErrors() {
    errors.value = {};
  }

  /**
   * Save form
   */
  async function save(): Promise<boolean> {
    touchAll();

    if (!validate()) {
      return false;
    }

    if (!options?.onSave) {
      console.warn("No onSave handler provided");
      return false;
    }

    saving.value = true;

    try {
      await options.onSave({ ...form } as T);
      updateInitialData();
      return true;
    } catch (e: any) {
      console.error("Failed to save form:", e);
      setError("_general" as keyof T, e.message ?? "Failed to save");
      return false;
    } finally {
      saving.value = false;
    }
  }

  /**
   * Auto-save functionality
   */
  function scheduleAutoSave() {
    if (!options?.autoSave || !options?.onSave) return;

    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value);
    }

    autoSaveTimer.value = setTimeout(() => {
      if (isDirty.value && isValid.value) {
        save();
      }
    }, options.autoSaveDelay ?? 2000);
  }

  // Watch form changes for auto-save
  if (options?.autoSave) {
    watch(
      () => ({ ...form }),
      () => {
        scheduleAutoSave();
      },
      { deep: true }
    );
  }

  return {
    // Form state
    form,
    errors,
    touched,
    saving,

    // Computed
    isDirty,
    isValid,
    touchedFields,

    // Methods
    validate,
    validateField,
    touch,
    touchAll,
    reset,
    save,
    setValues,
    setValue,
    setError,
    clearError,
    clearErrors,
    updateInitialData,
  };
}
