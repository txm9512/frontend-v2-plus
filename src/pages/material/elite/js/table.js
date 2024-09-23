
import { getZoomScale, getBasePosition, getOffsetTop, getNestedProperty } from './utils'
import { useOperatorData } from './formatOperatorData'
import { useBaseData } from './baseData'
import { ref } from 'vue';

// 格式化小数
export const formatNumber = (value, suffix = '', decimalPlaces = 1) => {
  return value ? value.toFixed(decimalPlaces) + suffix : '-';
}

// 表格材料开销格式化
export const costFormatter = (row, col) => {
  const value = getCellValue(row, col);
  return formatNumber(value);
}

// 表格百分比格式化
export const percentFormatter = (row, col) => {
  const value = getCellValue(row, col);
  return formatNumber(value * 100, '%');
}

// 获取表格单元格的值
export const getCellValue = (row, col) => {
  return row[col.property] || getNestedProperty(row, col.property) || 0;
}

const { barWidth, barHeight } = useBaseData()
const charIconBaseSize = 180;
const skillIconBaseSize = 128;
const charIconZoomScale = getZoomScale(barWidth, charIconBaseSize)
const skillIconZoomScale = getZoomScale(barWidth, skillIconBaseSize)
const charIconBasePosition = getBasePosition(charIconZoomScale, charIconBaseSize)
const skillIconBasePosition = getBasePosition(skillIconZoomScale, skillIconBaseSize)

const detailTableData = ref([])
const detailData = ref({})
const { totalCostObj, operatorList } = useOperatorData()

// 点击行查看干员分析信息
export const initDetailData = (row) => {
  if (row.rarity > 3) {
    detailTableData.value = []
    const rarityObj = totalCostObj.value[row.rarity];
    const { eliteCosts, skillCosts, modCosts } = rarityObj;
    const { charId, elite, skills, mods } = row;
    let iconClass = elite.iconClass = `char-icon bg-${charId.includes('custom') ? 'custom' : charId}`
    setIconInfo('char', eliteCosts, elite, {
      name: '精英化二',
      iconClass,
      style: {
        top: `${charIconBasePosition}px`,
      }
    });
    skills.forEach((item, index) => {
      iconClass = item.iconClass = `skill-icon bg-skill_icon_${item.iconId}`
      setIconInfo('skill', skillCosts, item, {
        name: charId.includes('custom') ? item.name : `${index + 1}技能：${item.name}`, 
        iconClass,
        style: {
          top: `${skillIconBasePosition}px`,
        }
      });
    });

    mods.forEach(item => {
      setIconInfo('mods', modCosts, item, {
        name: charId.includes('custom') ? item.typeName2 : `${item.typeName2}模组：${item.uniEquipName}`, 
      });
    });
  }
  detailData.value = row;
};

// 设置图标位置
const setIconInfo = (type, costs, item, tableIconInfo) => {
  const index = costs.findIndex(cost => cost === item.totalCost);
  const [ iconBasePosition, iconZoomScale ] = getIconBaseInfo(type);
  item.position = index + 1;
  item.totalPosition = costs.length;
  item.style = {
    top: `${iconBasePosition}px`,
    left: `${iconBasePosition}px`,
    transform: `scale(${iconZoomScale})`
  };
  item.contentStyle = {
    top: `${getOffsetTop([index + 1, costs.length, barHeight, barWidth])}px`,
  }
  item.textStyle = {
    right: `0`,
  }
  detailTableData.value.push({
    ...item,
    ...tableIconInfo,
    style: {
      ...item.style,
      ...tableIconInfo?.style,
    }
  });
};

// 获取图标基础样式信息
const getIconBaseInfo = (type) => {
  switch (type) {
    case 'char':
      return [ charIconBasePosition, charIconZoomScale ];
    case 'skill':
      return [ skillIconBasePosition, skillIconZoomScale ];
    default:
      return [ 0, 1 ];
  }
};


// 重置表格滚动条
export const resetTableScrollTop = (tableRef) => {
  const tableBody = tableRef.$el.querySelector('.el-scrollbar__wrap');
  if (tableBody) {
    tableBody.scrollTop = 0;
  }
}

export const useTableData = () => {
  return {
    detailData,
    detailTableData,
  }
}

// 筛选条件
const searchParams = ref({
  rarityCheckedList: [], // 当前已选择的干员星级列表
  professionCheckedList: [], // 已选择的职业列表
  searchKey: '', // 搜索关键词
})

// 分页参数
const size = 50
const eliteList = ref([])
const skillList = ref(operatorList.value.flatMap(item => item.skills))
const modList = ref(operatorList.value.flatMap(item => item.mods))
const tableDataMap = new Map()

// 初始化表格数据
export const initTableData = () => {
  console.log(`initTableData`, )
  // 根据筛选条件筛选干员列表
  const filteredOperators = operatorList.value.filter((data) => {
    if (searchParams.value.rarityCheckedList.length && !searchParams.value.rarityCheckedList.includes(data.rarity)) return false; // 干员星级搜索
    if (!searchParams.value.professionCheckedList?.length) return true; // 干员子职业搜索: 没选就默认返回所有职业的干员
    return searchParams.value.professionCheckedList.includes(data.subProfessionId);
  });
  tableDataMap.set('elite', filteredOperators)
  // 筛选后的干员列表拆出技能信息, 并排序
  tableDataMap.set('skills', filteredOperators.flatMap(item => item.skills).sort((a, b) => b.totalCost - a.totalCost))
  // 筛选后的干员列表拆出模组信息, 并排序
  tableDataMap.set('mods', filteredOperators.flatMap(item => item.mods).sort((a, b) => b.totalCost - a.totalCost))
}

export const rowClick = (row, emits) => {
  const { operatorName, charId } = row
  if (operatorName) row = operatorList.value.find(item => item.charId === charId)
  initDetailData(row)
  emits('openDetailDialog', true)
}

export const usePaginationParams = (key) => {
  const current = ref(0)
  const total = ref(0);
  const tableData = ref([])
  
  // 表格滚动底部加载更多
  const loadmore = () => {
    if (current.value * size < total.value) {
      current.value++
      getTableData()
    }
  }
  
  // 根据筛选条件筛选与分页表格数据
  const getTableData = () => {
    const tableList = tableDataMap.get(key)
    const { searchKey } = searchParams.value
    const filterFn = (data) => {
      if (key === 'elite') return data.name.includes(searchKey)
      else if (key === 'skills') return data.operatorName.includes(searchKey) || data.name.includes(searchKey) 
      else return data.operatorName.includes(searchKey) || data.uniEquipName.includes(searchKey)
    }
    // 排序号, 筛选
    const tableListFormat = tableList.map((item, index) => ({
      ...item,
      index: index + 1
    })).filter(filterFn)
    // 最大条数
    total.value = tableListFormat.length;
    // 分页
    const currentData = tableListFormat.slice(current.value * size, (current.value + 1) * size)
    tableData.value = current.value === 0 ? currentData : tableData.value.concat(currentData)
  }
  
  // 表格排序
  const sortChange = ({prop, order}) => {
    const tableList = tableDataMap.get(key)
    tableList.sort((a, b) => {
      const sortDirection = order === 'ascending' ? 1 : -1;
      return sortDirection * ((getNestedProperty(a, prop) || 0) - (getNestedProperty(b, prop) || 0));
    });

    current.value = 0
    getTableData()
  }
  
  return { 
    searchParams,
    size,
    current,
    total,
    eliteList,
    skillList,
    modList,
    tableData,
    loadmore,
    getTableData,
    sortChange,
   }
}