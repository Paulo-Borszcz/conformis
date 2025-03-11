/**
 * Calcula a similaridade de cosseno entre dois vetores
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Similaridade de cosseno entre 0 e 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Os vetores devem ter o mesmo tamanho para calcular similaridade de cosseno");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calcula a distância euclidiana entre dois vetores
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Distância euclidiana
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Os vetores devem ter o mesmo tamanho para calcular distância euclidiana");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Converte distância em similaridade (quanto menor a distância, maior a similaridade)
 * @param distance Valor da distância
 * @param maxDistance Distância máxima esperada
 * @returns Similaridade entre 0 e 1
 */
export function distanceToSimilarity(distance: number, maxDistance: number = 2): number {
  const cappedDistance = Math.min(distance, maxDistance);

  return 1 - cappedDistance / maxDistance;
}
