<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="queryParams.customerName"
        placeholder="关键字"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />

      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >{{ $t('table.search') }}</el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px;"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >{{ $t('table.add') }}</el-button>
      <el-button
        v-waves
        :loading="downloadLoading"
        class="filter-item"
        type="primary"
        icon="el-icon-download"
        @click="handleDownload"
      >{{ $t('table.export') }}</el-button>
      <el-checkbox
        v-model="showReviewer"
        class="filter-item"
        style="margin-left:15px;"
        @change="tableKey=tableKey+1"
      >{{ $t('table.reviewer') }}</el-checkbox>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="pagedData.items"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column
        label="Id"
        prop="id"
        sortable="custom"
        align="center"
        width="80px"
        :class-name="getSortClass('id')"
      >
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="客户名称" align="left">
        <template slot-scope="scope">
          <span>{{ scope.row.customerName }}</span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('table.actions')"
        align="center"
        width="230"
        class-name="fixed-width"
      >
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">编辑</el-button>
          <el-button
            v-if="row.status!=='deleted'"
            size="mini"
            type="danger"
            @click="handleModifyStatus(row,'deleted')"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="pagedData.totalCount>0"
      :total="pagedData.totalCount"
      :page.sync="queryParams.page"
      :limit.sync="queryParams.maxResultCount"
      @pagination="getList"
    />

    <el-dialog :title="textMap[dialogStatus]" width="700px" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="customerModel"
        label-position="left"
        label-width="100px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="customerModel.customerName" />
        </el-form-item>

        <!-- <el-form-item :label="$t('table.remark')">
          <el-input
            v-model="customerModel.remark"
            :autosize="{minRows: 2, maxRows: 4}"
            type="textarea"
            placeholder="Please input"
          />
        </el-form-item>-->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{ $t('table.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="dialogStatus==='create'?createData():updateData()"
        >{{ $t('table.confirm') }}</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPageviewsVisible" title="Reading statistics">
      <el-table :data="pageviewsData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pageviews" label="Pageviews" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPageviewsVisible = false">{{ $t('table.confirm') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Form } from "element-ui";
import { cloneDeep } from "lodash"; 
import { exportJson2Excel } from "@/utils/excel";
import { formatJson } from "@/utils";
import ajax from "@/utils/request";
import Pagination from "@/components/Pagination/index.vue";
import {
  CustomerServiceProxy,
  CreateOrEditCustomerDto,
  PagedResultDtoOfCreateOrEditCustomerDto
} from "@/api/abp-service-proxies";

@Component({
  name: "Customers",
  components: {
    Pagination
  }
  // ,
  // filters: {
  //   typeFilter: (type: string) => {
  //     return calendarTypeKeyValue[type];
  //   }
  // }
})
export default class extends Vue {
  private tableKey = 0;

  private total = 0;
  private listLoading = true;

  private queryParams = {
    customerName: "",
    page: 1,
    skipCount: function() {
      return (this.page - 1) * this.maxResultCount;
    },
    maxResultCount: 20,
    sorting: "id"
  };

  private showReviewer = false;
  private dialogFormVisible = false;
  private dialogStatus = "";
  private textMap = {
    update: "Edit",
    create: "Create"
  };
  private dialogPageviewsVisible = false;
  private pageviewsData = [];
  private rules = {
    type: [{ required: true, message: "type is required", trigger: "change" }],
    timestamp: [
      { required: true, message: "timestamp is required", trigger: "change" }
    ],
    title: [{ required: true, message: "title is required", trigger: "blur" }]
  };
  private downloadLoading = false;
  private customerModel = new CreateOrEditCustomerDto();
  private abpService = new CustomerServiceProxy(ajax);
  private pagedData = new PagedResultDtoOfCreateOrEditCustomerDto();
  created() {
    this.getList();
  }

  private async getList() {
    this.listLoading = true;
    let qp = this.queryParams;

    this.pagedData = await this.abpService.getAll(
      qp.customerName,
      null,
      qp.sorting,
      qp.skipCount(),
      qp.maxResultCount
    );

    // Just to simulate the time of the request
    setTimeout(() => {
      this.listLoading = false;
    }, 0.5 * 1000);
  }

  private handleFilter() {
    this.getList();
  }

  private handleModifyStatus(row: any, status: string) {
    this.abpService.delete(row.id);
    this.$message({
      message: "操作成功",
      type: "success"
    });
    row.status = status;
  }

  private sortChange(data: any) {
    const { prop, order } = data;
    if (prop === "id") {
      this.sortByID(order);
    }
  }

  private sortByID(order: string) {
    if (order === "ascending") {
      this.queryParams.sorting = "id";
    } else {
      this.queryParams.sorting = "id desc";
    }
    this.handleFilter();
  }

  private getSortClass(key: string) {
    const sort = this.queryParams.sorting;
    return sort === `${key}`
      ? "ascending"
      : sort === `${key} desc`
      ? "descending"
      : "";
  }

  private resetModelData() {
    this.customerModel = cloneDeep(new CreateOrEditCustomerDto());
  }

  private handleCreate() {
    this.resetModelData();
    this.dialogStatus = "create";
    this.dialogFormVisible = true;
    this.$nextTick(() => {
      (this.$refs["dataForm"] as Form).clearValidate();
    });
  }

  private createData() {
    (this.$refs["dataForm"] as Form).validate(async valid => {
      if (valid) {
        this.customerModel.id = 0;
        const data = await this.abpService.create(this.customerModel);
        this.pagedData.items.unshift(data);
        this.dialogFormVisible = false;

        this.$notify({
          title: "成功",
          message: "创建成功",
          type: "success",
          duration: 2000
        });
      }
    });
  }

  private handleUpdate(row: any) {
    this.customerModel = Object.assign({}, row);
    // this.customerModel.timestamp = +new Date(this.customerModel.timestamp);
    this.dialogStatus = "update";
    this.dialogFormVisible = true;
    this.$nextTick(() => {
      (this.$refs["dataForm"] as Form).clearValidate();
    });
  }

  private updateData() {
    (this.$refs["dataForm"] as Form).validate(async valid => {
      if (valid) {
        const data = await this.abpService.update(this.customerModel);
        for (const v of this.pagedData.items) {
          if (v.id === data.id) {
            const index = this.pagedData.items.indexOf(v);
            this.pagedData.items.splice(index, 1, data);
            break;
          }
        }
        this.dialogFormVisible = false;
        this.$notify({
          title: "成功",
          message: "更新成功",
          type: "success",
          duration: 2000
        });
      }
    });
  }

  private handleDownload() {
    this.downloadLoading = true;
    const tHeader = ["timestamp", "title", "type", "importance", "status"];
    const filterVal = ["timestamp", "title", "type", "importance", "status"];
    const data = formatJson(filterVal, this.pagedData.items);
    exportJson2Excel(tHeader, data, "table-list");
    this.downloadLoading = false;
  }
}
</script>
