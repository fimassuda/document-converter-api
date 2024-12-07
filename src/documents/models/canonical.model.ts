export class CanonicalModel {
  metadata: Record<string, any>;
  content: any;

  constructor(data: { metadata?: Record<string, any>; content?: any }) {
    this.metadata = data.metadata || {};
    this.content = data.content;
  }
}
