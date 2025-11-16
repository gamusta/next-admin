import data from "@/app/admin/data.json";
import {DataTable} from "@/components/data-table";

export default function Page() {
  return <DataTable data={data}/>
}
