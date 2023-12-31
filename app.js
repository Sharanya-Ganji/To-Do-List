//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ =require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema ={
  name:{
    type:String,
    required:[true, "noname"]
  }
};

const Item= mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your new To Do List"
});

const item2 = new Item({
  name: "Hit the + to add a new item"
});

const item3 = new Item({
  name: "<-- Hit to delete an item"
});

const defItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if(foundItems.length===0){
      Item.insertMany(defItems, function(err){
        if(err)
        console.log(err);
        else
        console.log("Successfully saved items to db");
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res){
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
       if(!foundList){
        //create new list
        const list= new List({
          name: customListName,
          items: defItems
        });
        list.save();
        res.redirect("/" + customListName);
       }

       else
        //show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
  });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const nextItem= new Item({
    name:itemName
  });

   if(listName === "Today"){
    nextItem.save();
    res.redirect("/")
   }
   else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(nextItem);
      foundList.save();
      res.redirect("/" + listName);
    });
   }
   
});

app.post("/delete", function(req, res){
  const checkedItem=req.body.checkbox;
  const listName= req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem, function(err){
      if(!err){
       console.log("Successfully deleted the checked item");
       res.redirect("/");
      }
   });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
   }

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
