import { useState, useCallback } from 'react';
import { parseInterventionFile } from '../lib/parsers/excelParser';
import { upsertInterventions } from '../lib/supabase/queries/interventions';
import type { UploadResult } from '../types';

export type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error';

export interface UseFileUploadReturn {
  uploadFile: (file: File, hospitalName: string) => Promise<UploadResult>;
  status: UploadStatus;
  result: UploadResult | null;
  error: string | null;
}

export function useFileUpload(): UseFileUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File, hospitalName: string): Promise<UploadResult> => {
      console.log('[useFileUpload] uploadFile called', { fileName: file.name, hospitalName });
      setStatus('parsing');
      setResult(null);
      setError(null);

      // 1. Parse the file
      let parseResult;
      try {
        parseResult = await parseInterventionFile(file);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus('error');
        const failResult: UploadResult = { inserted: 0, skipped: 0, errors: [{ row: 0, message: msg }] };
        setResult(failResult);
        return failResult;
      }

      const { valid, errors: parseErrors } = parseResult;
      console.log('[useFileUpload] parse result', { valid: valid.length, errors: parseErrors.length });

      // If nothing is valid, short-circuit
      if (valid.length === 0) {
        const finalResult: UploadResult = {
          inserted: 0,
          skipped: 0,
          errors: parseErrors,
        };
        setResult(finalResult);
        setStatus(parseErrors.length > 0 ? 'error' : 'success');
        return finalResult;
      }

      // 2. Attach hospitalName to every record
      const recordsWithHospital = valid.map((r) => ({ ...r, hospitalName }));

      // 3. Upload to Supabase
      setStatus('uploading');
      const { inserted, error: uploadError } = await upsertInterventions(recordsWithHospital);

      const skipped = valid.length - inserted;
      const allErrors = uploadError
        ? [...parseErrors, { row: 0, message: uploadError }]
        : parseErrors;

      const finalResult: UploadResult = {
        inserted,
        skipped,
        errors: allErrors,
      };

      setResult(finalResult);
      setStatus(uploadError ? 'error' : 'success');
      if (uploadError) setError(uploadError);
      if (!uploadError) window.dispatchEvent(new CustomEvent('infectus:data-updated'));

      return finalResult;
    },
    [],
  );

  return { uploadFile, status, result, error };
}
