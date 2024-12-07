import { CanonicalModel } from '../models/canonical.model';

export interface FormatAdapter {
  toCanonical(input: any): CanonicalModel;
  fromCanonical(model: CanonicalModel): any;
}
