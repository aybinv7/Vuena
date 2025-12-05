import { column, Table } from "@powersync/web";

const expenses = new Table(
  {
    group_id: column.text,
    paid_by: column.text,
    amount: column.real,
    description: column.text,
    category: column.text,
    date: column.text,
    created_at: column.text,
  },
  { indexes: { group: ["group_id"] } }
);

const splits = new Table(
  {
    expense_id: column.text,
    user_id: column.text,
    amount_owed: column.real,
    group_id: column.text,
  },
  { indexes: { expense: ["expense_id"], group: ["group_id"] } }
);

const settlements = new Table(
  {
    group_id: column.text,
    payer_id: column.text,
    receiver_id: column.text,
    amount: column.real,
    date: column.text,
  },
  { indexes: { group: ["group_id"] } }
);

export { expenses, splits, settlements };
