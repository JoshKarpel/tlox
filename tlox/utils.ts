export function zip<A, B>(a: Array<A>, b: Array<B>): Array<[A, B]> {
  return a.map((v, idx) => [v, b[idx]])
}
