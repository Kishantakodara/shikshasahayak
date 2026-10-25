// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: CURRICULUM TREE SERVICE
// Service operations for curriculum_nodes (units, topics, subtopics)
// ============================================================

import { CurriculumNode, CurriculumNodeType } from "./types";

export async function getCurriculumTree(db: D1Database, subjectId: string): Promise<CurriculumNode[]> {
  const { results } = await db.prepare(`
    SELECT cn.*,
           (SELECT COUNT(1) FROM documents d WHERE d.curriculum_node_id = cn.id) as documents_count
    FROM curriculum_nodes cn
    WHERE cn.subject_id = ? AND cn.is_active = 1
    ORDER BY cn.sort_order ASC, cn.node_number ASC, cn.created_at ASC
  `).bind(subjectId).all<any>();

  if (!results || results.length === 0) {
    return [];
  }

  // Build recursive parent-child tree
  const nodeMap = new Map<string, CurriculumNode>();
  const rootNodes: CurriculumNode[] = [];

  for (const row of results) {
    const node: CurriculumNode = {
      id: row.id,
      subject_id: row.subject_id,
      parent_id: row.parent_id,
      node_type: row.node_type as CurriculumNodeType,
      node_number: Number(row.node_number),
      title: row.title,
      description: row.description,
      sort_order: Number(row.sort_order),
      is_active: Number(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at,
      documents_count: Number(row.documents_count || 0),
      children: [],
    };
    nodeMap.set(node.id, node);
  }

  for (const node of nodeMap.values()) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children!.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

export async function createCurriculumNode(
  db: D1Database,
  data: {
    subject_id: string;
    parent_id?: string | null;
    node_type: CurriculumNodeType;
    node_number: number;
    title: string;
    description?: string;
    sort_order?: number;
  }
): Promise<CurriculumNode> {
  const id = `cn_${data.node_type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sortOrder = data.sort_order ?? Math.floor(data.node_number);

  await db.prepare(`
    INSERT INTO curriculum_nodes (id, subject_id, parent_id, node_type, node_number, title, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.subject_id,
    data.parent_id || null,
    data.node_type,
    data.node_number,
    data.title,
    data.description || null,
    sortOrder
  ).run();

  const created = await db.prepare(`SELECT * FROM curriculum_nodes WHERE id = ?`).bind(id).first<any>();
  return created as CurriculumNode;
}

export async function updateCurriculumNode(
  db: D1Database,
  id: string,
  updates: Partial<Pick<CurriculumNode, 'title' | 'description' | 'node_number' | 'sort_order' | 'is_active' | 'parent_id'>>
): Promise<CurriculumNode> {
  const node = await db.prepare(`SELECT * FROM curriculum_nodes WHERE id = ?`).bind(id).first<any>();
  if (!node) throw new Error("Curriculum node not found");

  const title = updates.title ?? node.title;
  const description = updates.description !== undefined ? updates.description : node.description;
  const node_number = updates.node_number ?? node.node_number;
  const sort_order = updates.sort_order ?? node.sort_order;
  const is_active = updates.is_active ?? node.is_active;
  const parent_id = updates.parent_id !== undefined ? updates.parent_id : node.parent_id;

  await db.prepare(`
    UPDATE curriculum_nodes
    SET title = ?, description = ?, node_number = ?, sort_order = ?, is_active = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(title, description, node_number, sort_order, is_active, parent_id, id).run();

  const updated = await db.prepare(`SELECT * FROM curriculum_nodes WHERE id = ?`).bind(id).first<any>();
  return updated as CurriculumNode;
}

export async function deleteCurriculumNode(db: D1Database, id: string): Promise<boolean> {
  // Check if documents are attached
  const attachedDocs = await db.prepare(`SELECT COUNT(1) as count FROM documents WHERE curriculum_node_id = ?`).bind(id).first<any>();
  if (attachedDocs && Number(attachedDocs.count) > 0) {
    // Unlink documents first
    await db.prepare(`UPDATE documents SET curriculum_node_id = NULL WHERE curriculum_node_id = ?`).bind(id).run();
  }

  await db.prepare(`DELETE FROM curriculum_nodes WHERE id = ?`).bind(id).run();
  return true;
}
