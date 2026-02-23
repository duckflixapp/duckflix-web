import type { SubtitleDTO } from '@duckflix/shared';
import { getLanguageName } from './format';

export const appendSubtitleName = (subs: SubtitleDTO[]) => {
    const occ = new Map<string, number>();
    const ver = (code: string) => {
        if (occ.has(code)) {
            const v = occ.get(code)! + 1;
            occ.set(code, v);
            return ` ${v}`;
        }
        occ.set(code, 1);
        return '';
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return subs.map((s) => ({ name: s.name || getLanguageName(s.language) + ver(s.language), ...s }));
};
