//cpu转为以核为单位
export function to_cpu_h(s: string) {
  if (s.endsWith("n")) {
    return (Number(s.replace("n", "")) / 1000000000.0).toFixed(2);
  }
  if (s.endsWith("m")) {
    return (Number(s.replace("m", "")) / 1000.0).toFixed(2);
  }
  if (s.endsWith("M")) {
    return (Number(s.replace("M", "")) / 1024.0).toFixed(2);
  }

  return s;
}
//内存转为以G为单位
export function to_memory_g(s: string) {
  if (s.endsWith("Ki")) {
    return (Number(s.replace("Ki", "")) / 1000000.0).toFixed(2);
  }
  if (s.endsWith("K")) {
    return (Number(s.replace("K", "")) / 1024.0 / 1024.0).toFixed(2);
  }
  if (s.endsWith("k")) {
    return (Number(s.replace("k", "")) / 1024.0 / 1024.0).toFixed(2);
  }
  if (s.endsWith("m")) {
    return (
      Number(s.replace("m", "")) /
      1000.0 /
      1024.0 /
      1024.0 /
      1024.0
    ).toFixed(2);
  }
  if (s.endsWith("M")) {
    return (Number(s.replace("M", "")) / 1024.0).toFixed(2);
  }
  if (s.endsWith("Mi")) {
    return (Number(s.replace("Mi", "")) / 1000.0).toFixed(2);
  }

  if (s.endsWith("Gi")) {
    return s.replace("Gi", "");
  }
  if (s.endsWith("G")) {
    return s.replace("G", "");
  }

  return Number(s) / 1024.0 / 1024.0 / 1024.0;
}
