export class SessionBoundary {
  private generation = 0;
  private userId: string | null = null;
  change(userId: string | null) { this.userId = userId; this.generation++; }
  capture() { return { generation: this.generation, userId: this.userId }; }
  accepts(snapshot: { generation: number; userId: string | null }) {
    return snapshot.generation === this.generation && snapshot.userId === this.userId;
  }
}
