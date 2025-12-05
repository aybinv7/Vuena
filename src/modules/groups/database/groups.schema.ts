import { column, Table } from "@powersync/web";

const groups = new Table({
  name: column.text,
  currency: column.text,
  created_by: column.text,
  created_at: column.text,
});

const members = new Table(
  {
    group_id: column.text,
    user_id: column.text,
    joined_at: column.text,
  },
  { indexes: { group: ["group_id"] } }
);

export { groups, members };
