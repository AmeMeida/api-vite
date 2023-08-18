import mysql from "mysql2/promise";
import { DB } from "./enviroment";

let pool: mysql.Pool;

try {
  pool = mysql.createPool(DB);
} catch (error) {
  console.error("Verifique as credenciais do banco de dados", error);
  process.exit(1);
}

/**
 * Executa uma query no banco de dados a partir de uma string de template.
 * Valores devem ser passados diretamente na literal, no formato `${variavel}`.
 * No fundo, a query é executada com o método `execute` do módulo `mysql2` como um prepared statement,
 * e os valores são enviados como parâmetros. Sem risco de SQL injection.
 * @example const alunos = await sql`SELECT * FROM alunos`;
 * @example const [aluno] = await sql`SELECT * FROM alunos WHERE id = ${id}`;
 * @param strings Query em formato de string de template
 * @param values Valores a serem substituídos na query
 * @returns Array de objetos com os resultados da query
 */
export async function sql<T = unknown>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const query = strings.join("?");
  const [rows] = await pool.execute(query, values);

  return rows as T[];
}

export async function prepare<T = unknown, K extends string = string, Values extends readonly K[] = ReadonlyArray<K>>(
  strings: TemplateStringsArray,
  ...keys: Values
): Promise<Values extends [{}, ...K[]] ? (values?: { [Key in Values[number]]: unknown; } | undefined) => Promise<T[]> : () => Promise<T[]>> {
  const query = strings.join("?");
  const statement = await (await pool.getConnection()).prepare(query);

  if (keys && keys.length >= 1) {
    return (async (values: {
      [Key in typeof keys[number]]: unknown
    }) => {
      const params = keys.map((key) => values[key]);
  
      const [rows] = await statement.execute(params);
      return rows as T[];
    }) as any;
  } else {
    return (async () => {
      const [rows] = await statement.execute([]);

      return rows as T[];
    }) as any;
  }
}

export async function insert(table: string, data: Record<string, unknown>) {
  const columns = Object.keys(data);
  const values = Object.values(data);

  const interrogations = Array(values.length).fill("?");

  const query = `INSERT INTO ${table}
    (${columns.join(", ")}) VALUES (${interrogations.join(", ")})`;
  await pool.execute(query, [values]);
}

export default pool;
